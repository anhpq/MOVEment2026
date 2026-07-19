import {App as AntdApp, Button, Drawer, Form, Input, Select} from "antd";
import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useMovementStore} from "../store";
import type {StationFormValues} from "../types";
import {updateAdminStation} from "../api";

export function StationEditorPage() {
  const navigate = useNavigate();
  const params = useParams<{stationId: string}>();
  const {modal, message} = AntdApp.useApp();
  const stationDefinitions = useMovementStore(
    (state) => state.stationDefinitions,
  );
  const saveStationDefinition = useMovementStore(
    (state) => state.saveStationDefinition,
  );
  const session = useMovementStore((state) => state.session);
  const [form] = Form.useForm<StationFormValues>();
  const [isOpen, setIsOpen] = useState(true);

  const station = stationDefinitions.find(
    (item) => item.id === params.stationId,
  );
  const isEditing = Boolean(station);
  const layout = {
    labelCol: {span: 8},
    wrapperCol: {span: 16},
  };

  useEffect(() => {
    if (station) {
      form.setFieldsValue({...station, trackingMode: station.trackingMode ?? "BOTH"});
      return;
    }

    form.setFieldsValue({id: "", name: "", trackingMode: "BOTH"});
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
                await updateAdminStation(station.id, {
                  name: values.name,
                  description: values.description ?? null,
                  trackingMode: values.trackingMode,
                });
              }
              saveStationDefinition(values, station?.id);
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
        <Form.Item
          label="Estimated Duration (minutes)"
          name="durationMinutes"
          rules={[
            {
              required: true,
              message: "Please enter the estimated duration for the station",
            },
          ]}>
          <Input placeholder="Estimated duration" type="number" />
        </Form.Item>
        <Form.Item label="YouTube Video URL" name="youtubeUrl">
          <Input placeholder="YouTube video URL" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block>
          {isEditing ? "Update Station Info" : "Create Station"}
        </Button>
      </Form>
    </Drawer>
  );
}
