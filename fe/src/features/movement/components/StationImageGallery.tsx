import {PictureOutlined} from "@ant-design/icons";
import {App, Button, Image} from "antd";
import {useState} from "react";
import {useTranslation} from "react-i18next";
import {getSafeApiErrorTranslationKey} from "../api";
import {fetchPlayerStationImageUrls} from "../playerData";

const IMAGE_FALLBACK =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Crect width='1200' height='800' fill='%23f2f3f5'/%3E%3Cpath d='M360 560l150-180 105 120 80-90 145 150H360z' fill='%23c7cbd1'/%3E%3Ccircle cx='760' cy='285' r='58' fill='%23c7cbd1'/%3E%3C/svg%3E";

type StationImageGalleryProps = {
  imageUrls: string[];
  imageCount?: number;
  stationId?: string;
};

export function StationImageGallery({
  imageUrls,
  imageCount,
  stationId,
}: StationImageGalleryProps) {
  const {message} = App.useApp();
  const {t} = useTranslation();
  const galleryKey = stationId ?? "inline-gallery";
  const [openGalleryKey, setOpenGalleryKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedImages, setLoadedImages] = useState<{
    galleryKey: string;
    imageUrls: string[];
  } | null>(null);
  const loadedImageUrls =
    imageUrls.length ? imageUrls
    : loadedImages?.galleryKey === galleryKey ? loadedImages.imageUrls
    : [];

  const items = loadedImageUrls.map((src, index) => ({
    src,
    alt: t("common.stationImage", {index: index + 1}),
    referrerPolicy: "no-referrer" as const,
  }));

  return (
    <>
      <Button
        block
        className="station-media-button station-image-button"
        icon={<PictureOutlined />}
        loading={isLoading}
        disabled={(imageCount ?? imageUrls.length) === 0}
        aria-label={t("common.viewImages")}
        onClick={async () => {
          if (loadedImageUrls.length || !stationId) {
            setOpenGalleryKey(galleryKey);
            return;
          }

          setIsLoading(true);
          try {
            const nextImageUrls = await fetchPlayerStationImageUrls(stationId);
            setLoadedImages({galleryKey, imageUrls: nextImageUrls});
            setOpenGalleryKey(nextImageUrls.length > 0 ? galleryKey : null);
          } catch (error) {
            message.error(t(getSafeApiErrorTranslationKey(
              error,
              "stationData.imagesLoadFailed",
            )));
          } finally {
            setIsLoading(false);
          }
        }}>
        {t("common.viewImages")}
      </Button>
      <Image.PreviewGroup
        items={items}
        fallback={IMAGE_FALLBACK}
        preview={{
          open: openGalleryKey === galleryKey,
          onOpenChange: (open) => setOpenGalleryKey(open ? galleryKey : null),
        }}
      />
    </>
  );
}
