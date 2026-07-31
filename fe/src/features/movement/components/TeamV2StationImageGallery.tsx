import {PictureOutlined} from "@ant-design/icons";
import {App, Button, Image} from "antd";
import {useState} from "react";
import {useTranslation} from "react-i18next";
import {getSafeApiErrorTranslationKey} from "../api";
import {fetchPlayerStationImageUrls} from "../playerData";

const V2_IMAGE_FALLBACK =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Crect width='1200' height='800' fill='%23030e14'/%3E%3Cpath d='M360 560l150-180 105 120 80-90 145 150H360z' fill='%23204a52'/%3E%3Ccircle cx='760' cy='285' r='58' fill='%232fe4f0' fill-opacity='.45'/%3E%3C/svg%3E";

type TeamV2StationImageGalleryProps = {
  imageUrls: string[];
  imageCount?: number;
  stationId: string;
};

export function TeamV2StationImageGallery({
  imageUrls,
  imageCount,
  stationId,
}: TeamV2StationImageGalleryProps) {
  const {message} = App.useApp();
  const {t} = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedImageUrls, setLoadedImageUrls] = useState<string[] | null>(null);
  const resolvedImageUrls = imageUrls.length ? imageUrls : (loadedImageUrls ?? []);
  const items = resolvedImageUrls.map((src, index) => ({
    src,
    alt: t("common.stationImage", {index: index + 1}),
    referrerPolicy: "no-referrer" as const,
  }));

  return (
    <>
      <Button
        block
        className="team-v2-detail-media-button team-v2-detail-gallery-button"
        icon={<PictureOutlined />}
        loading={isLoading}
        disabled={(imageCount ?? imageUrls.length) === 0}
        aria-label={t("common.viewImages")}
        onClick={async () => {
          if (resolvedImageUrls.length) {
            setIsOpen(true);
            return;
          }

          setIsLoading(true);
          try {
            const nextImageUrls = await fetchPlayerStationImageUrls(stationId);
            setLoadedImageUrls(nextImageUrls);
            setIsOpen(nextImageUrls.length > 0);
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
        fallback={V2_IMAGE_FALLBACK}
        preview={{
          open: isOpen,
          onOpenChange: setIsOpen,
        }}
      />
    </>
  );
}
