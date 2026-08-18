import {
  DashboardOutlined,
  SettingOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {Segmented} from "antd";
import {useLocation, useNavigate} from "react-router-dom";
import {AdminV2ConfigView} from "./AdminV2ConfigView";
import {AdminV2ManagementView} from "./AdminV2ManagementView";
import {AdminV2OperationsView} from "./AdminV2OperationsView";

export function AdminV2Page() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab =
    location.pathname.startsWith("/admin/v2/management") ? "management"
    : location.pathname.startsWith("/admin/v2/config") ? "config"
    : "operations";

  const handleSegmentChange = (value: string) => {
    navigate(`/admin/v2/${value}`);
  };

  return (
    <div className="admin-v2-container" style={{padding: "16px"}}>
      <div style={{marginBottom: 16, display: "flex", justifyContent: "center"}}>
        <Segmented
          size="large"
          value={currentTab}
          onChange={(val) => handleSegmentChange(val as string)}
          options={[
            {
              label: "Vận hành",
              value: "operations",
              icon: <DashboardOutlined />,
            },
            {
              label: "Quản lý",
              value: "management",
              icon: <TeamOutlined />,
            },
            {
              label: "Cấu hình",
              value: "config",
              icon: <SettingOutlined />,
            },
          ]}
        />
      </div>

      {currentTab === "operations" && <AdminV2OperationsView />}
      {currentTab === "management" && <AdminV2ManagementView />}
      {currentTab === "config" && <AdminV2ConfigView />}
    </div>
  );
}
