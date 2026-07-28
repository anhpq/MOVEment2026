CREATE TABLE "station_images" (
  "id" SERIAL NOT NULL,
  "station_id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "station_images_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "station_images_sort_order_check" CHECK ("sort_order" >= 0 AND "sort_order" <= 9),
  CONSTRAINT "station_images_station_id_sort_order_key" UNIQUE ("station_id", "sort_order"),
  CONSTRAINT "station_images_station_id_url_key" UNIQUE ("station_id", "url"),
  CONSTRAINT "station_images_station_id_fkey"
    FOREIGN KEY ("station_id") REFERENCES "stations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "station_images_station_id_sort_order_idx"
  ON "station_images"("station_id", "sort_order");
