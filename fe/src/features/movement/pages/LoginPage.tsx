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
import {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {useMovementStore} from "../store";
import logo from "../../../assets/ST-logo.png";

type LoginFormValues = {
  username: string;
  password: string;
};

export function LoginPage() {
  const navigate = useNavigate();
  const login = useMovementStore((state) => state.login);
  const session = useMovementStore((state) => state.session);
  const teams = useMovementStore((state) => state.teams);
  const authAccounts = useMovementStore((state) => state.authAccounts);
  const [form] = Form.useForm<LoginFormValues>();
  const {message} = AntdApp.useApp();

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
            onFinish={(values) => {
              const username = values.username.trim();
              const password = values.password.trim();

              const matchedAccount = authAccounts.find(
                (account) =>
                  account.username === username &&
                  account.password === password,
              );

              if (matchedAccount) {
                login({username, role: matchedAccount.role, teamId: null});
                message.success(`Login successful as ${matchedAccount.role}`);
                navigate("/stations");
                return;
              }

              const matchedTeam = teams.find(
                (team) =>
                  team.username === username && team.password === password,
              );

              if (!matchedTeam) {
                message.error("Invalid username or password");
                return;
              }

              login({
                username: matchedTeam.username,
                role: "user",
                teamId: matchedTeam.id,
              });
              message.success("Login successful");
              navigate("/stations");
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

            <Button type="primary" htmlType="submit" block size="large">
              Login
            </Button>
          </Form>
        </Flex>
      </Card>
    </div>
  );
}
