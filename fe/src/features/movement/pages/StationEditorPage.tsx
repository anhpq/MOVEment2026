import QRCode from "qrcode";
import {App as AntdApp, Button, Drawer, Flex, Form, Input, InputNumber, Select, Typography} from "antd";
import {useEffect, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useMovementStore} from "../store";
import type {StationFormValues} from "../types";
import {createAdminStation, getAdminStationQrTokens, updateAdminStation} from "../api";
import {fetchAdminDatabase} from "../adminData";
import {DEFAULT_STATION_MAX_POINTS} from "../constants";
import {
  cacheStationQrTokens,
  getCachedStationQrToken,
  setCachedStationQrToken,
} from "../stationQrTokenCache";

export function StationEditorPage() {
  const navigate = useNavigate();
  const params = useParams<{stationId: string}>();
  const {modal, message} = AntdApp.useApp();
  const stationDefinitions = useMovementStore(
    (state) => state.stationDefinitions,
  );
  const loadDatabase = useMovementStore((state) => state.loadDatabase);
  const session = useMovementStore((state) => state.session);
  const [form] = Form.useForm<StationFormValues>();
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
      title: "One-time Station QR",
      content: (
        <Flex vertical gap={12} align="center">
          <img src={dataUrl} alt={`${context} QR`} width={260} height={260} />
          <Typography.Text>{context}</Typography.Text>
          <Typography.Text type="warning">
            Save or download this QR now. For security, the token cannot be viewed again.
          </Typography.Text>
          <Button type="primary" onClick={() => {
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = filename;
            link.click();
          }}>
            Download PNG
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

    form.setFieldsValue({id: "", name: "", durationMinutes: 0, trackingMode: "BOTH", markerX: 50, markerY: 50, gameType: "QUIZ", maxPoints: DEFAULT_STATION_MAX_POINTS, checkInQrToken: "", checkOutQrToken: ""});
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
      title={isEditing ? "Edit Station" : "Create Station"}
      onClose={handleClose}
      open={isOpen}>
      <Form
        form={form}
        {...layout}
        onFinish={(values) => {
          const duplicate = stationDefinitions.some(
            (item) => item.id === values.id && item.id !== station?.id,
          );

          if (duplicate) {
            message.error(
              "Station ID already exists. Please choose a different ID.",
            );
            return;
          }

          modal.confirm({
            centered: true,
            title: isEditing ? "Update Station?" : "Create New Station?",
            content:
              "The station list for all teams will be synchronized with this change.",
            okText: "Confirm",
            cancelText: "Cancel",
            onOk: async () => {
              if (station && session?.role === "admin") {
                const checkInQrToken = values.checkInQrToken?.trim() ?? "";
                const checkOutQrToken = values.checkOutQrToken?.trim() ?? "";
                const updated = await updateAdminStation(station.id, {
                  name: values.name,
                  description: values.description ?? null,
                  trackingMode: values.trackingMode,
                  mapX: values.markerX,
                  mapY: values.markerY,
                  mediaUrl: values.youtubeUrl ?? null,
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
                  description: values.description ?? null,
                  trackingMode: values.trackingMode,
                  mapX: values.markerX ?? 50,
                  mapY: values.markerY ?? 50,
                  gameType: values.gameType ?? "QUIZ",
                  maxPoints: values.maxPoints,
                  mediaUrl: values.youtubeUrl ?? null,
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
                  "Station updated successfully"
                : "New station created successfully",
              );
              handleClose();
            },
          });
        }}>
        <Form.Item
          label="ID"
          name="id"
          rules={[
            {required: true, message: "Please enter an ID for the station"},
          ]}>
          <Input disabled={isEditing} placeholder="ST06" />
        </Form.Item>
        <Form.Item
          label="Name"
          name="name"
          rules={[
            {required: true, message: "Please enter a name for the station"},
          ]}>
          <Input placeholder="Maze" />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input placeholder="Station description" />
        </Form.Item>
        <Form.Item
          label="Tracking Mode"
          name="trackingMode"
          tooltip="Score: no duration; Time: QR start/end record duration; Both: record duration and allow points"
          rules={[
            {
              required: true,
              message: "Please choose how this station is counted",
            },
          ]}>
          <Select
            options={[
              {value: "BOTH", label: "Both time and score"},
              {value: "SCORE", label: "Score only"},
              {value: "TIME", label: "Time only"},
            ]}
          />
        </Form.Item>
        <Form.Item label="YouTube Video URL" name="youtubeUrl">
          <Input placeholder="YouTube video URL" />
        </Form.Item>
        <Form.Item label="Map X (%)" name="markerX" rules={[{required: true}]}>
          <InputNumber min={0} max={100} className="full-width" />
        </Form.Item>
        <Form.Item label="Map Y (%)" name="markerY" rules={[{required: true}]}>
          <InputNumber min={0} max={100} className="full-width" />
        </Form.Item>
        <Form.Item label="Game Type" name="gameType" rules={[{required: !isEditing}]}>
          <Input disabled={isEditing} />
        </Form.Item>
        <Form.Item label="Max Points" name="maxPoints" rules={[{required: !isEditing}]}>
          <InputNumber disabled={isEditing} min={0} className="full-width" />
        </Form.Item>
        {isEditing && (
          <>
            <Form.Item
              label="Check-in QR token"
              name="checkInQrToken"
              help="Leave empty to keep the current token. Enter a new token to replace it.">
              <Input placeholder="MV26-SQ1-I-..." autoComplete="off" />
            </Form.Item>
            <Form.Item
              label="Check-out QR token"
              name="checkOutQrToken"
              help="Leave empty to keep the current token. Enter a new token to replace it.">
              <Input placeholder="MV26-SQ1-O-..." autoComplete="off" />
            </Form.Item>
          </>
        )}
        <Button type="primary" htmlType="submit" block>
          {isEditing ? "Update Station Info" : "Create Station"}
        </Button>
      </Form>
    </Drawer>
  );
}
