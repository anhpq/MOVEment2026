import {LockOutlined, UserOutlined} from "@ant-design/icons";
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Typography,
  Image,
} from "antd";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useMovementStore} from "../store";
import {loginTeam, loginUser} from "../api";
import logo from "../../../assets/ST-logo.png";

type LoginFormValues = {
  username: string;
  password: string;
};

function mapBackendRole(role: string) {
  return role === "ADMIN" ? "admin" : role === "SYSTEM_ADMIN" ? "system-admin" : "user";
}

export function LoginPage() {
  const navigate = useNavigate();
  const login = useMovementStore((state) => state.login);
  const session = useMovementStore((state) => state.session);
  const [form] = Form.useForm<LoginFormValues>();
  const {message} = AntdApp.useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      navigate("/stations", {replace: true});
    }
  }, [navigate, session]);

  return (
    <div className="login-screen">
      <Card className="surface-card login-card">
        <Flex vertical gap={18} className="full-width">
          <div>
            <Image
              src={logo}
              alt="MOVEment 2026"
              preview={false}
              className="login-logo"
            />
            <Typography.Title level={2} className="login-title">
              MOVEment 2026
            </Typography.Title>
          </div>

          <Alert
            type="info"
            showIcon
            description={
              <Flex vertical gap={4}>
                <Typography.Text strong>Demo Account</Typography.Text>
                <Typography.Text>
                  All credentials are read from `database.json`. Example team
                  `team01/team01`, default admin account is `admin/admin` and
                  `systemadmin/systemadmin`.
                </Typography.Text>
              </Flex>
            }
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={async (values) => {
              const username = values.username.trim();
              const password = values.password.trim();

              setIsSubmitting(true);
              try {
                try {
                  const teamResponse = await loginTeam(
                    username,
                    password,
                    "web",
                  );
                  login({
                    username: teamResponse.team.username,
                    role: "user",
                    teamId: String(teamResponse.team.id),
                    accessToken: teamResponse.accessToken,
                  });
                  message.success("Login successful");
                  navigate("/stations");
                  return;
                } catch (teamLoginError) {
                  // Fall back to admin/user login if team login fails.
                }

                const userResponse = await loginUser(username, password);
                login({
                  username: userResponse.user.username,
                  role: mapBackendRole(userResponse.user.role),
                  teamId: null,
                  accessToken: userResponse.accessToken,
                });
                message.success("Login successful");
                navigate("/stations");
              } catch (error) {
                const messageText =
                  error instanceof Error
                    ? error.message
                    : "Invalid username or password";
                message.error(messageText || "Invalid username or password");
              } finally {
                setIsSubmitting(false);
              }
            }}>
            <Form.Item
              label="Username"
              name="username"
              rules={[
                {required: true, message: "Please enter your username"},
                {min: 3, message: "Username must be at least 3 characters"},
              ]}>
              <Input prefix={<UserOutlined />} placeholder="team.lead" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                {required: true, message: "Please enter your password"},
                {min: 5, message: "Password must be at least 5 characters"},
              ]}>
              <Input.Password prefix={<LockOutlined />} placeholder="••••••" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={isSubmitting}
            >
              Login
            </Button>
          </Form>
        </Flex>
      </Card>
    </div>
  );
}
