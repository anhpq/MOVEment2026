import {App as AntdApp, Button, Drawer, Form, Input, InputNumber} from "antd";
import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useMovementStore} from "../store";
import type {TeamFormValues} from "../types";

export function TeamEditorPage() {
  const navigate = useNavigate();
  const params = useParams<{teamId: string}>();
  const {modal, message} = AntdApp.useApp();
  const teams = useMovementStore((state) => state.teams);
  const saveTeam = useMovementStore((state) => state.saveTeam);
  const [form] = Form.useForm<TeamFormValues>();
  const [isOpen, setIsOpen] = useState(true);

  const team = teams.find((item) => item.id === params.teamId);
  const isEditing = Boolean(team);

  useEffect(() => {
    if (team) {
      form.setFieldsValue(team);
      return;
    }

    form.setFieldsValue({
      id: "",
      name: "",
      username: "",
      password: "",
      score: 0,
      finish: 0,
      totalTimeMinutes: 0,
    });
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
          const duplicate = teams.some(
            (item) => item.id === values.id && item.id !== team?.id,
          );

          if (duplicate) {
            message.error(
              "Team ID already exists. Please choose a different ID.",
            );
            return;
          }

          modal.confirm({
            centered: true,
            title: isEditing ? "Update Team?" : "Create New Team?",
            content:
              "The new team will have all stations initialized to the 'New' state.",
            okText: "Confirm",
            cancelText: "Cancel",
            onOk: () => {
              saveTeam(values, team?.id);
              message.success(
                isEditing ?
                  "Team updated successfully"
                : "New team created successfully",
              );
              handleClose();
            },
          });
        }}>
        <Form.Item
          label="ID"
          name="id"
          rules={[{required: true, message: "Please enter a team ID"}]}>
          <Input disabled={isEditing} placeholder="TEAM11" />
        </Form.Item>
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
          label="Password"
          name="password"
          rules={[
            {required: true, message: "Please enter a team password"},
            {min: 5, message: "Password must be at least 5 characters long"},
          ]}>
          <Input.Password placeholder="team11" />
        </Form.Item>
        <Form.Item label="Score" name="score" rules={[{required: true}]}>
          <InputNumber min={0} className="full-width" />
        </Form.Item>
        <Form.Item label="Finish" name="finish" rules={[{required: true}]}>
          <InputNumber min={0} max={99} className="full-width" />
        </Form.Item>
        <Form.Item
          label="Total Time (min)"
          name="totalTimeMinutes"
          rules={[{required: true}]}>
          <InputNumber min={0} className="full-width" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block>
          {isEditing ? "Update Team Info" : "Create Team"}
        </Button>
      </Form>
    </Drawer>
  );
}
