import {Alert, App, Button, Card, Form, Input, Space, Statistic, Typography} from "antd";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {getPlayerFinal, submitFinalAnswer, type FinalResponse} from "../api";

type FinalFormValues = {
  answer: string;
};

function getRemainingSeconds(nextAttemptAt: string | null) {
  if (!nextAttemptAt) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil((new Date(nextAttemptAt).getTime() - Date.now()) / 1000),
  );
}

export function FinalPage() {
  const navigate = useNavigate();
  const {message} = App.useApp();
  const [form] = Form.useForm<FinalFormValues>();
  const [final, setFinal] = useState<FinalResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clockTick, setClockTick] = useState(() => Date.now());

  const refresh = useCallback(async () => {
    setFinal(await getPlayerFinal());
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), 3000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => setClockTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remainingCooldownSeconds = useMemo(() => {
    void clockTick;
    return getRemainingSeconds(final?.nextAttemptAt ?? null);
  }, [clockTick, final?.nextAttemptAt]);

  const isCoolingDown = remainingCooldownSeconds > 0;
  const canSubmit = Boolean(final?.canSubmit && !isCoolingDown);

  return (
    <Card title={final?.title ?? "Final Challenge"}>
      <Space direction="vertical" size={16} className="full-width">
        {!final ? (
          <Alert type="info" message="Loading Final Challenge..." showIcon />
        ) : !final.isOpen ? (
          <Alert
            type="info"
            showIcon
            message="Final Challenge is not open yet"
            description={`It opens automatically when the event ends at ${final.eventEndTime}.`}
          />
        ) : final.blockedByActiveStation ? (
          <Alert
            type="warning"
            showIcon
            message="Finish your active station first"
            description="Final Challenge is open, but your team must finish the current station before entering."
            action={
              final.activeStationId ? (
                <Button onClick={() => navigate(`/stations/${final.activeStationId}`)}>
                  Continue Station
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Typography.Paragraph>{final.clueText}</Typography.Paragraph>

            {final.teamSubmission ? (
              <Alert
                type="success"
                showIcon
                message="Final answer accepted"
                description={`Rank ${final.teamSubmission.winnerRank ?? "-"} - ${final.teamSubmission.pointsAwarded} bonus points`}
              />
            ) : (
              <>
                {final.wrongAttemptCount > 0 && (
                  <Alert
                    type={isCoolingDown ? "warning" : "info"}
                    showIcon
                    message={`${final.wrongAttemptCount} wrong attempt${final.wrongAttemptCount === 1 ? "" : "s"}`}
                    description={
                      isCoolingDown ?
                        `Try again in ${remainingCooldownSeconds} second${remainingCooldownSeconds === 1 ? "" : "s"}.`
                      : "You can submit another answer now."
                    }
                  />
                )}

                {isCoolingDown && (
                  <Statistic
                    title="Cooldown"
                    value={remainingCooldownSeconds}
                    suffix="s"
                  />
                )}

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={async ({answer}) => {
                    if (isSubmitting) {
                      return;
                    }
                    setIsSubmitting(true);
                    try {
                      const result = await submitFinalAnswer(answer.trim().toUpperCase());
                      form.resetFields();
                      await refresh();
                      if (result.isCorrect) {
                        message.success("Final answer accepted");
                      } else {
                        message.warning("Wrong answer. Cooldown applied.");
                      }
                    } catch (error) {
                      await refresh();
                      message.error(error instanceof Error ? error.message : "Submit failed");
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}>
                  <Form.Item
                    name="answer"
                    normalize={(value: string | undefined) =>
                      value ? value.toUpperCase() : value
                    }
                    rules={[{required: true}]}>
                    <Input placeholder="Final answer" disabled={!canSubmit || isSubmitting} />
                  </Form.Item>
                  <Button
                    htmlType="submit"
                    type="primary"
                    block
                    loading={isSubmitting}
                    disabled={!canSubmit}>
                    Submit Final
                  </Button>
                </Form>
              </>
            )}
          </>
        )}
      </Space>
    </Card>
  );
}
