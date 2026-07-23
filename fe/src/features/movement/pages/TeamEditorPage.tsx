import QRCode from "qrcode";
import {App as AntdApp, Button, Drawer, Flex, Form, Input, InputNumber, Typography} from "antd";
import {useEffect, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useMovementStore} from "../store";
import {
  buildTeamQrLoginUrl,
  cacheTeamQrPayload,
  getCachedTeamQrToken,
  setCachedTeamQrToken,
} from "../teamQrTokenCache";
import type {TeamFormValues} from "../types";
import {createAdminTeam, getAdminTeamQrLoginTokens, updateAdminTeam} from "../api";
import {fetchAdminDatabase} from "../adminData";

export function TeamEditorPage() {
  const navigate = useNavigate();
  const params = useParams<{teamId: string}>();
  const {modal, message} = AntdApp.useApp();
  const teams = useMovementStore((state) => state.teams);
  const loadDatabase = useMovementStore((state) => state.loadDatabase);
  const [form] = Form.useForm<TeamFormValues>();
  const [isOpen, setIsOpen] = useState(true);
  const initialQrTokenRef = useRef("");

  const team = teams.find((item) => item.id === params.teamId);
  const isEditing = Boolean(team);

  const showGeneratedQr = async (payload: string, filename: string, context: string) => {
    const dataUrl = await QRCode.toDataURL(payload, {width: 320, margin: 2});
    modal.info({
      centered: true,
      width: 520,
      title: "One-time Team QR",
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
    if (team) {
      initialQrTokenRef.current = "";
      form.setFieldsValue({...team, qrToken: ""});
      void getAdminTeamQrLoginTokens(team.id).then((tokens) => {
        if (cancelled) {
          return;
        }
        const activeToken = tokens.find((token) => token.status === "ACTIVE");
        const qrToken = activeToken?.rawToken ?? getCachedTeamQrToken(team.id);
        initialQrTokenRef.current = qrToken;
        form.setFieldsValue({qrToken});
      }).catch(() => undefined);
      return () => {
        cancelled = true;
      };
    }

    form.setFieldsValue({
      id: "",
      name: "",
      username: "",
      password: "",
      score: 0,
      finish: 0,
      totalTimeMinutes: 0,
      qrToken: "",
    });
    return () => {
      cancelled = true;
    };
  }, [form, team]);

  const handleClose = () => {
    setIsOpen(false);
    navigate("/system-config");
  };

  return (
    <Drawer
      title={isEditing ? "Edit Team" : "Create Team"}
      onClose={handleClose}
      open={isOpen}>
      <Form
        form={form}
        layout="horizontal"
        onFinish={(values) => {
          modal.confirm({
            centered: true,
            title: isEditing ? "Update Team?" : "Create New Team?",
            content:
              "The new team will have all stations initialized to the 'New' state.",
            okText: "Confirm",
            cancelText: "Cancel",
            onOk: async () => {
              try {
                if (team) {
                  const qrToken = values.qrToken?.trim() ?? "";
                  const updated = await updateAdminTeam(team.id, {
                    name: values.name,
                    username: values.username,
                    captainName: values.captainName,
                    password: values.password || undefined,
                    ...(qrToken && qrToken !== initialQrTokenRef.current ? {qrToken} : {}),
                  });
                  const qrLogin = updated.qrLogin;
                  if (qrLogin) {
                    const payload =
                      qrLogin.qrLoginUrl ??
                      qrLogin.loginUrl ??
                      buildTeamQrLoginUrl(qrLogin.rawToken);
                    cacheTeamQrPayload(team.id, payload);
                    await showGeneratedQr(
                      payload,
                      `team-${team.id}-qr.png`,
                      `${team.name} · Team QR login`,
                    );
                  } else if (qrToken) {
                    setCachedTeamQrToken(team.id, qrToken);
                  }
                } else {
                  const created = await createAdminTeam({
                    name: values.name,
                    username: values.username,
                    captainName: values.captainName,
                    password: values.password,
                  });
                  const qrLoginUrl = created.qrLoginUrl ?? created.loginUrl;
                  if (qrLoginUrl) {
                    cacheTeamQrPayload(String(created.id), qrLoginUrl);
                    modal.info({
                      centered: true,
                      width: 680,
                      title: `QR login for ${created.name}`,
                      content: (
                        <Flex vertical gap={12}>
                          <Typography.Text>
                            This reusable URL is shown only now. Store or print the QR securely.
                          </Typography.Text>
                          <Input.TextArea value={qrLoginUrl} readOnly autoSize />
                          {created.qrLoginExpiresAt && (
                            <Typography.Text className="muted-copy compact-copy">
                              Expires at {new Date(created.qrLoginExpiresAt).toLocaleString("vi-VN")}
                            </Typography.Text>
                          )}
                        </Flex>
                      ),
                    });
                  }
                }
                loadDatabase(await fetchAdminDatabase());
                message.success(isEditing ? "Team updated successfully" : "New team created successfully");
                handleClose();
              } catch (error) {
                message.error(error instanceof Error ? error.message : "Unable to save team");
                throw error;
              }
            },
          });
        }}>
        {isEditing && <Form.Item label="ID"><Input disabled value={team?.id} /></Form.Item>}
        <Form.Item
          label="Name"
          name="name"
          rules={[{required: true, message: "Please enter a team name"}]}>
          <Input placeholder="Kite Crew" />
        </Form.Item>
        <Form.Item
          label="Username"
          name="username"
          rules={[{required: true, message: "Please enter a team username"}]}>
          <Input placeholder="team11" />
        </Form.Item>
        <Form.Item
          label="Captain"
          name="captainName">
          <Input placeholder="Captain name" />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[
            {required: !isEditing, message: "Please enter a team password"},
            {min: 5, message: "Password must be at least 5 characters long"},
          ]}>
          <Input.Password placeholder={isEditing ? "Leave blank to keep current password" : "team11"} />
        </Form.Item>
        <Form.Item label="Score" name="score" rules={[{required: true}]}>
          <InputNumber disabled min={0} className="full-width" />
        </Form.Item>
        <Form.Item label="Finished" name="finish" rules={[{required: true}]}>
          <InputNumber disabled min={0} max={99} className="full-width" />
        </Form.Item>
        {isEditing && (
          <Form.Item
            label="QR token"
            name="qrToken"
            help="Leave empty to keep the current token. Enter a new token to replace it.">
            <Input placeholder="New one-time Team QR token" autoComplete="off" />
          </Form.Item>
        )}
        <Form.Item
          label="Total Time (min)"
          name="totalTimeMinutes"
          rules={[{required: true}]}>
          <InputNumber disabled min={0} className="full-width" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block>
          {isEditing ? "Update Team Info" : "Create Team"}
        </Button>
      </Form>
    </Drawer>
  );
}
