import { useRef, useState, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey, useGetMe, type User } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Camera, Languages, RotateCcw, Save, Settings as SettingsIcon, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const AVATAR_FILE_LIMIT = 5 * 1024 * 1024;
const AVATAR_PREVIEW_SIZE = 128;
const AVATAR_CANVAS_SIZE = 512;
const AVATAR_DATA_URL_LIMIT = 1_000_000;

type AvatarCrop = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

type ImageSize = {
  width: number;
  height: number;
};

function loadAvatarImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Avatar image failed to load"));
    image.src = src;
  });
}

async function renderCroppedAvatar(src: string, crop: AvatarCrop) {
  const image = await loadAvatarImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_CANVAS_SIZE;
  canvas.height = AVATAR_CANVAS_SIZE;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available");
  }

  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  const baseScale = Math.max(AVATAR_CANVAS_SIZE / imageWidth, AVATAR_CANVAS_SIZE / imageHeight);
  const drawWidth = imageWidth * baseScale * crop.scale;
  const drawHeight = imageHeight * baseScale * crop.scale;
  const previewToCanvas = AVATAR_CANVAS_SIZE / AVATAR_PREVIEW_SIZE;
  const drawX = (AVATAR_CANVAS_SIZE - drawWidth) / 2 + crop.offsetX * previewToCanvas;
  const drawY = (AVATAR_CANVAS_SIZE - drawHeight) / 2 + crop.offsetY * previewToCanvas;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, AVATAR_CANVAS_SIZE, AVATAR_CANVAS_SIZE);
  context.save();
  context.beginPath();
  context.arc(AVATAR_CANVAS_SIZE / 2, AVATAR_CANVAS_SIZE / 2, AVATAR_CANVAS_SIZE / 2, 0, Math.PI * 2);
  context.clip();
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  context.restore();

  return canvas.toDataURL("image/jpeg", 0.88);
}

export default function Settings() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: user, isLoading } = useGetMe();
  const { t, i18n } = useTranslation();
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
  const [avatarImageSize, setAvatarImageSize] = useState<ImageSize | null>(null);
  const [avatarScale, setAvatarScale] = useState(1);
  const [avatarOffsetX, setAvatarOffsetX] = useState(0);
  const [avatarOffsetY, setAvatarOffsetY] = useState(0);
  const [isPreparingAvatar, setIsPreparingAvatar] = useState(false);

  const resetAvatarEditor = () => {
    setAvatarDraft(null);
    setAvatarImageSize(null);
    setAvatarScale(1);
    setAvatarOffsetX(0);
    setAvatarOffsetY(0);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (avatarUrl: string | null) => {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json() as Promise<User>;
    },
    onSuccess: (updatedUser, avatarUrl) => {
      queryClient.setQueryData(getGetMeQueryKey(), updatedUser);
      resetAvatarEditor();
      toast.success(avatarUrl ? t("profile.avatarSaved") : t("profile.avatarRemoved"));
    },
  });

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("profile.avatarInvalid"));
      return;
    }

    if (file.size > AVATAR_FILE_LIMIT) {
      toast.error(t("profile.avatarTooLarge"));
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result;
      if (typeof result !== "string") {
        toast.error(t("profile.avatarInvalid"));
        return;
      }

      try {
        const image = await loadAvatarImage(result);
        setAvatarDraft(result);
        setAvatarImageSize({
          width: image.naturalWidth || image.width,
          height: image.naturalHeight || image.height,
        });
        setAvatarScale(1);
        setAvatarOffsetX(0);
        setAvatarOffsetY(0);
      } catch {
        toast.error(t("profile.avatarInvalid"));
      }
    };
    reader.onerror = () => toast.error(t("profile.avatarInvalid"));
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!avatarDraft) return;

    try {
      setIsPreparingAvatar(true);
      const croppedAvatar = await renderCroppedAvatar(avatarDraft, {
        scale: avatarScale,
        offsetX: avatarOffsetX,
        offsetY: avatarOffsetY,
      });

      if (croppedAvatar.length > AVATAR_DATA_URL_LIMIT) {
        toast.error(t("profile.avatarTooLarge"));
        return;
      }

      await updateProfileMutation.mutateAsync(croppedAvatar);
    } catch {
      toast.error(t("profile.avatarSaveFailed"));
    } finally {
      setIsPreparingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await updateProfileMutation.mutateAsync(null);
    } catch {
      toast.error(t("profile.avatarSaveFailed"));
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (!user) return null;

  const currentLanguage = i18n.resolvedLanguage?.startsWith("ru") ? "ru" : "en";
  const avatarPreviewUrl = avatarDraft || user.avatarUrl || "";
  const isSavingAvatar = isPreparingAvatar || updateProfileMutation.isPending;
  const previewBaseScale = avatarImageSize
    ? Math.max(AVATAR_PREVIEW_SIZE / avatarImageSize.width, AVATAR_PREVIEW_SIZE / avatarImageSize.height)
    : 1;
  const previewImageStyle = avatarImageSize
    ? {
        width: `${avatarImageSize.width * previewBaseScale * avatarScale}px`,
        height: `${avatarImageSize.height * previewBaseScale * avatarScale}px`,
        transform: `translate(calc(-50% + ${avatarOffsetX}px), calc(-50% + ${avatarOffsetY}px))`,
      }
    : undefined;
  const languages = [
    { code: "en", label: t("profile.languageEnglish"), short: "EN" },
    { code: "ru", label: t("profile.languageRussian"), short: "RU" },
  ];

  const handleLanguageChange = (language: string) => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
    i18n.changeLanguage(language);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-auto max-w-3xl px-4 sm:px-6 py-8 md:py-12"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleAvatarFileChange}
      />

      <Card className="rounded-3xl border-border/50 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-8 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SettingsIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">{t("profile.settings")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t("profile.settingsSubtitle")}</p>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-[220px_1fr]">
            <section>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("profile.avatar")}</div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="relative mx-auto mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-muted shadow-inner">
                  {avatarPreviewUrl ? (
                    avatarDraft && previewImageStyle ? (
                      <img
                        src={avatarPreviewUrl}
                        alt={t("profile.avatarPreview")}
                        className="absolute left-1/2 top-1/2 max-w-none"
                        style={previewImageStyle}
                      />
                    ) : (
                      <img
                        src={avatarPreviewUrl}
                        alt={t("profile.avatarPreview")}
                        className="h-full w-full object-cover"
                      />
                    )
                  ) : (
                    <span className="text-4xl font-bold text-primary">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="grid gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full whitespace-normal"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                    {t("profile.chooseAvatar")}
                  </Button>
                  <Button
                    type="button"
                    className="w-full whitespace-normal"
                    onClick={handleSaveAvatar}
                    disabled={!avatarDraft || isSavingAvatar}
                  >
                    <Save className="h-4 w-4" />
                    {isSavingAvatar ? t("profile.savingAvatar") : t("profile.saveAvatar")}
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="whitespace-normal"
                      onClick={() => {
                        setAvatarScale(1);
                        setAvatarOffsetX(0);
                        setAvatarOffsetY(0);
                      }}
                      disabled={!avatarDraft || isSavingAvatar}
                    >
                      <RotateCcw className="h-4 w-4" />
                      {t("profile.resetAvatar")}
                    </Button>
                    {avatarDraft ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="whitespace-normal"
                        onClick={resetAvatarEditor}
                        disabled={isSavingAvatar}
                      >
                        {t("profile.cancelAvatar")}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="whitespace-normal text-destructive"
                        onClick={handleRemoveAvatar}
                        disabled={!user.avatarUrl || isSavingAvatar}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t("profile.removeAvatar")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="space-y-8">
              <section className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                    <span>{t("profile.avatarScale")}</span>
                    <span>{avatarScale.toFixed(1)}x</span>
                  </div>
                  <Slider
                    min={1}
                    max={3}
                    step={0.05}
                    value={[avatarScale]}
                    onValueChange={([value]) => setAvatarScale(value ?? 1)}
                    disabled={!avatarDraft || isSavingAvatar}
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">{t("profile.avatarHorizontal")}</div>
                  <Slider
                    min={-48}
                    max={48}
                    step={1}
                    value={[avatarOffsetX]}
                    onValueChange={([value]) => setAvatarOffsetX(value ?? 0)}
                    disabled={!avatarDraft || isSavingAvatar}
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">{t("profile.avatarVertical")}</div>
                  <Slider
                    min={-48}
                    max={48}
                    step={1}
                    value={[avatarOffsetY]}
                    onValueChange={([value]) => setAvatarOffsetY(value ?? 0)}
                    disabled={!avatarDraft || isSavingAvatar}
                  />
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Languages className="h-4 w-4" />
                  {t("profile.language")}
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/50 p-1.5">
                  {languages.map((language) => {
                    const isActive = currentLanguage === language.code;
                    return (
                      <button
                        key={language.code}
                        type="button"
                        onClick={() => handleLanguageChange(language.code)}
                        className={`rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                          isActive
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                        }`}
                      >
                        <span className="block text-xs font-bold uppercase tracking-wider text-primary">{language.short}</span>
                        <span className="block text-sm font-semibold">{language.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{t("profile.languageDescription")}</p>
              </section>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
