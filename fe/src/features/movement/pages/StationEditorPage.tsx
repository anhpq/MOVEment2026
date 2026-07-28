import QRCode from "qrcode";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {App as AntdApp, Button, Divider, Drawer, Flex, Form, Input, InputNumber, Select, Typography} from "antd";
import {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {useNavigate, useParams} from "react-router-dom";
import {useMovementStore} from "../store";
import type {StationFormValues} from "../types";
import {createAdminStation, getAdminStationQrTokens, updateAdminStation} from "../api";
import {fetchAdminDatabase} from "../adminData";
import {DEFAULT_STATION_MAX_POINTS, GAME_TYPE_OPTIONS} from "../constants";
import {
  cacheStationQrTokens,
  getCachedStationQrToken,
  setCachedStationQrToken,
} from "../stationQrTokenCache";

export function StationEditorPage() {
  const navigate = useNavigate();
  const params = useParams<{stationId: string}>();
  const {modal, message} = AntdApp.useApp();
  const {t} = useTranslation();
  const stationDefinitions = useMovementStore(
    (state) => state.stationDefinitions,
  );
  const loadDatabase = useMovementStore((state) => state.loadDatabase);
  const session = useMovementStore((state) => state.session);
  const [form] = Form.useForm<StationFormValues>();
  const selectedGameType = Form.useWatch("gameType", form);
  const [isOpen, setIsOpen] = useState(true);
  const initialQrTokensRef = useRef({
    checkInQrToken: "",
    checkOutQrToken: "",
  });

  const station = stationDefinitions.find(
    (item) => item.id === params.stationId,
  );
  const isEditing = Boolean(station);
  const layout = {
    labelCol: {span: 8},
    wrapperCol: {span: 16},
  };

  const showGeneratedQr = async (rawToken: string, filename: string, context: string) => {
    const dataUrl = await QRCode.toDataURL(rawToken, {width: 320, margin: 2});
    modal.info({
      centered: true,
      width: 520,
      title: t("stationEditor.oneTimeQr"),
      content: (
        <Flex vertical gap={12} align="center">
          <img src={dataUrl} alt={`${context} QR`} width={260} height={260} />
          <Typography.Text>{context}</Typography.Text>
          <Typography.Text type="warning">
            {t("stationEditor.saveQr")}
          </Typography.Text>
          <Button type="primary" onClick={() => {
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = filename;
            link.click();
          }}>
            {t("stationEditor.downloadPng")}
          </Button>
        </Flex>
      ),
    });
  };

  useEffect(() => {
    let cancelled = false;
    if (station) {
      initialQrTokensRef.current = {checkInQrToken: "", checkOutQrToken: ""};
      form.setFieldsValue({
        ...station,
        nameEn: station.nameEn ?? station.name,
        descriptionEn: station.descriptionEn ?? null,
        markerX: station.markerX ?? 50,
        markerY: station.markerY ?? 50,
        trackingMode: station.trackingMode ?? "BOTH",
        checkInQrToken: "",
        checkOutQrToken: "",
      });
      void getAdminStationQrTokens(station.id).then((tokens) => {
        if (cancelled) {
          return;
        }
        const activeCheckIn = tokens.find((token) => token.purpose === "CHECK_IN" && token.status === "ACTIVE");
        const activeCheckOut = tokens.find((token) => token.purpose === "CHECK_OUT" && token.status === "ACTIVE");
        const checkInQrToken = activeCheckIn?.rawToken ?? getCachedStationQrToken(station.id, "CHECK_IN");
        const checkOutQrToken = activeCheckOut?.rawToken ?? getCachedStationQrToken(station.id, "CHECK_OUT");
        initialQrTokensRef.current = {checkInQrToken, checkOutQrToken};
        form.setFieldsValue({checkInQrToken, checkOutQrToken});
      }).catch(() => undefined);
      return () => {
        cancelled = true;
      };
    }

    form.setFieldsValue({id: "", name: "", nameEn: "", durationMinutes: 0, trackingMode: "BOTH", markerX: 50, markerY: 50, gameType: "STANDARD", maxPoints: DEFAULT_STATION_MAX_POINTS, imageUrls: [], checkInQrToken: "", checkOutQrToken: ""});
    return () => {
      cancelled = true;
    };
  }, [form, station]);

  const handleClose = () => {
    setIsOpen(false);
    navigate("/system-config");
  };

  return (
    <Drawer
      title={isEditing ? t("stationEditor.editTitle") : t("stationEditor.createTitle")}
      onClose={handleClose}
      open={isOpen}>
      <Form
        form={form}
        {...layout}
        onFinish={(values) => {
          const imageUrls = (values.imageUrls ?? []).map((url) => url.trim());
          if (new Set(imageUrls).size !== imageUrls.length) {
            message.error(t("stationEditor.imageUrlsDuplicate"));
            return;
          }
          const duplicate = stationDefinitions.some(
            (item) => item.id === values.id && item.id !== station?.id,
          );

          if (duplicate) {
            message.error(
              t("stationEditor.duplicateId"),
            );
            return;
          }

          modal.confirm({
            centered: true,
            title: isEditing ? t("stationEditor.updateConfirmTitle") : t("stationEditor.createConfirmTitle"),
            content: t("stationEditor.syncConfirm"),
            okText: t("stationEditor.confirm"),
            cancelText: t("stationEditor.cancel"),
            onOk: async () => {
              if (station && session?.role === "admin") {
                const checkInQrToken = values.checkInQrToken?.trim() ?? "";
                const checkOutQrToken = values.checkOutQrToken?.trim() ?? "";
                const updated = await updateAdminStation(station.id, {
                  name: values.name,
                  nameEn: values.nameEn,
                  description: values.description ?? null,
                  descriptionEn: values.descriptionEn ?? null,
                  trackingMode: values.trackingMode,
                  mapX: values.markerX,
                  mapY: values.markerY,
                  gameType: values.gameType,
                  maxPoints: values.maxPoints,
                  mediaUrl: values.youtubeUrl ?? null,
                  imageUrls,
                  ...(checkInQrToken && checkInQrToken !== initialQrTokensRef.current.checkInQrToken ? {checkInQrToken} : {}),
                  ...(checkOutQrToken && checkOutQrToken !== initialQrTokensRef.current.checkOutQrToken ? {checkOutQrToken} : {}),
                });
                if (updated.qrTokens?.length) {
                  cacheStationQrTokens(station.id, updated.qrTokens);
                } else {
                  setCachedStationQrToken(station.id, "CHECK_IN", checkInQrToken);
                  setCachedStationQrToken(station.id, "CHECK_OUT", checkOutQrToken);
                }
                const previewToken = updated.qrTokens?.[0];
                if (previewToken?.rawToken) {
                  await showGeneratedQr(previewToken.rawToken, `station-${station.id}-qr.png`, `${station.name} · ${previewToken.purpose}`);
                }
              } else {
                const createdStation = await createAdminStation({
                  id: values.id,
                  name: values.name,
                  nameEn: values.nameEn,
                  description: values.description ?? null,
                  descriptionEn: values.descriptionEn ?? null,
                  trackingMode: values.trackingMode,
                  mapX: values.markerX ?? 50,
                  mapY: values.markerY ?? 50,
                  gameType: values.gameType ?? "STANDARD",
                  maxPoints: values.maxPoints,
                  mediaUrl: values.youtubeUrl ?? null,
                  imageUrls,
                });
                if (createdStation.qrTokens?.length) {
                  cacheStationQrTokens(createdStation.id, createdStation.qrTokens);
                  modal.info({
                    centered: true,
                    width: 680,
                    title: `Station QR tokens for ${createdStation.name}`,
                    content: (
                      <Flex vertical gap={12}>
                        {createdStation.qrTokens.map((token) => (
                          <Input.TextArea
                            key={token.purpose}
                            value={`${token.purpose}: ${token.rawToken ?? ""}`}
                            readOnly
                            autoSize
                          />
                        ))}
                      </Flex>
                    ),
                  });
                }
              }
              loadDatabase(await fetchAdminDatabase());
              message.success(
                isEditing ?
                  t("stationEditor.updated")
                : t("stationEditor.created"),
              );
              handleClose();
            },
          });
        }}>
        <Form.Item
          label="ID"
          name="id"
          rules={[
            {required: true, message: t("stationEditor.idRequired")},
          ]}>
          <Input disabled={isEditing} placeholder="ST06" />
        </Form.Item>
        <Divider>{t("stationEditor.viSection")}</Divider>
        <Form.Item
          label={t("stationEditor.nameVi")}
          name="name"
          rules={[
            {required: true, message: t("stationEditor.nameViRequired")},
          ]}>
          <Input placeholder="Mê Trận" />
        </Form.Item>
        <Form.Item label={t("stationEditor.descriptionVi")} name="description">
          <Input placeholder="Mô tả Station" />
        </Form.Item>
        <Divider>{t("stationEditor.enSection")}</Divider>
        <Form.Item
          label={t("stationEditor.nameEn")}
          name="nameEn"
          rules={[
            {required: true, message: t("stationEditor.nameEnRequired")},
          ]}>
          <Input placeholder="Maze" />
        </Form.Item>
        <Form.Item label={t("stationEditor.descriptionEn")} name="descriptionEn">
          <Input placeholder="Station description" />
        </Form.Item>
        <Form.Item
          label={t("stationEditor.trackingMode")}
          name="trackingMode"
          tooltip={t("stationEditor.trackingModeHelp")}
          rules={[
            {
              required: true,
              message: t("stationEditor.trackingModeRequired"),
            },
          ]}>
          <Select
            options={[
              {value: "BOTH", label: t("stationEditor.both")},
              {value: "SCORE", label: t("stationEditor.scoreOnly")},
              {value: "TIME", label: t("stationEditor.timeOnly")},
            ]}
          />
        </Form.Item>
        <Form.Item
          label={t("stationEditor.youtube")}
          name="youtubeUrl"
          rules={[
            {
              required: selectedGameType === "ST",
              message: t("stationEditor.youtubeRequired"),
            },
            {type: "url", message: t("stationEditor.validUrl")},
          ]}>
          <Input placeholder="YouTube video URL" />
        </Form.Item>
        <Divider>{t("stationEditor.gallerySection")}</Divider>
        <Form.List name="imageUrls">
          {(fields, {add, remove, move}) => (
            <Flex vertical gap={10} className="station-image-editor-list">
              {fields.map((field, index) => (
                <Flex key={field.key} gap={8} align="start">
                  <Form.Item
                    {...field}
                    className="station-image-editor-field"
                    rules={[
                      {
                        required: true,
                        message: t("stationEditor.imageUrlRequired"),
                      },
                      {max: 2048},
                      {
                        validator: async (_, value: unknown) => {
                          if (typeof value !== "string" || !value.trim()) {
                            return;
                          }
                          try {
                            const parsed = new URL(value.trim());
                            if (parsed.protocol !== "https:") {
                              throw new Error("Unsupported protocol");
                            }
                          } catch {
                            throw new Error(t("stationEditor.imageUrlHttps"));
                          }
                        },
                      },
                    ]}>
                    <Input
                      placeholder={t("stationEditor.imageUrl")}
                      autoComplete="off"
                    />
                  </Form.Item>
                  <Button
                    icon={<ArrowUpOutlined />}
                    disabled={index === 0}
                    aria-label={t("stationEditor.moveImageUp")}
                    title={t("stationEditor.moveImageUp")}
                    onClick={() => move(index, index - 1)}
                  />
                  <Button
                    icon={<ArrowDownOutlined />}
                    disabled={index === fields.length - 1}
                    aria-label={t("stationEditor.moveImageDown")}
                    title={t("stationEditor.moveImageDown")}
                    onClick={() => move(index, index + 1)}
                  />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    aria-label={t("stationEditor.removeImage")}
                    title={t("stationEditor.removeImage")}
                    onClick={() => remove(index)}
                  />
                </Flex>
              ))}
              <Typography.Text type="secondary">
                {t("stationEditor.maxImages")}
              </Typography.Text>
              <Button
                icon={<PlusOutlined />}
                disabled={fields.length >= 10}
                onClick={() => add("")}>
                {t("stationEditor.addImage")}
              </Button>
            </Flex>
          )}
        </Form.List>
        <Form.Item label={t("stationEditor.mapX")} name="markerX" rules={[{required: true}]}>
          <InputNumber min={0} max={100} className="full-width" />
        </Form.Item>
        <Form.Item label={t("stationEditor.mapY")} name="markerY" rules={[{required: true}]}>
          <InputNumber min={0} max={100} className="full-width" />
        </Form.Item>
        <Form.Item label={t("stationEditor.gameType")} name="gameType" rules={[{required: true}]}>
          <Select options={[...GAME_TYPE_OPTIONS]} />
        </Form.Item>
        <Form.Item label={t("stationEditor.maxPoints")} name="maxPoints" rules={[{required: true}]}>
          <InputNumber min={0} precision={0} className="full-width" />
        </Form.Item>
        {isEditing && (
          <>
            <Form.Item
              label={t("stationEditor.checkInQr")}
              name="checkInQrToken"
              help={t("stationEditor.keepQrHelp")}>
              <Input placeholder="MV26-SQ1-I-..." autoComplete="off" />
            </Form.Item>
            <Form.Item
              label={t("stationEditor.checkOutQr")}
              name="checkOutQrToken"
              help={t("stationEditor.keepQrHelp")}>
              <Input placeholder="MV26-SQ1-O-..." autoComplete="off" />
            </Form.Item>
          </>
        )}
        <Button type="primary" htmlType="submit" block>
          {isEditing ? t("stationEditor.updateButton") : t("stationEditor.createButton")}
        </Button>
      </Form>
    </Drawer>
  );
}
