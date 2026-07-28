import {PictureOutlined} from "@ant-design/icons";
import {Button, Image} from "antd";
import {useState} from "react";
import {useTranslation} from "react-i18next";

const IMAGE_FALLBACK =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Crect width='1200' height='800' fill='%23f2f3f5'/%3E%3Cpath d='M360 560l150-180 105 120 80-90 145 150H360z' fill='%23c7cbd1'/%3E%3Ccircle cx='760' cy='285' r='58' fill='%23c7cbd1'/%3E%3C/svg%3E";

type StationImageGalleryProps = {
  imageUrls: string[];
};

export function StationImageGallery({imageUrls}: StationImageGalleryProps) {
  const {t} = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const items = imageUrls.map((src, index) => ({
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
        disabled={!imageUrls.length}
        aria-label={t("common.viewImages")}
        onClick={() => setIsOpen(true)}>
        {t("common.viewImages")}
      </Button>
      <Image.PreviewGroup
        items={items}
        fallback={IMAGE_FALLBACK}
        preview={{
          open: isOpen,
          onOpenChange: (open) => setIsOpen(open),
        }}
      />
    </>
  );
}
