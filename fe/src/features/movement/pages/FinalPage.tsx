import {Alert, App, Button, Card, Form, Input, Typography} from "antd";
import {useEffect, useState} from "react";
import {getPlayerFinal, submitFinalAnswer, type FinalResponse} from "../api";

export function FinalPage() {
  const {message} = App.useApp();
  const [final, setFinal] = useState<FinalResponse | null>(null);
  const refresh = () => getPlayerFinal().then(setFinal);
  useEffect(() => { void refresh(); }, []);
  return <Card title={final?.title ?? "Final Challenge"}>
    {!final?.isOpen ? <Alert type="info" message={`Opens at ${final?.startsAt ?? ""}`} /> :
      <>
        <Typography.Paragraph>{final.clueText}</Typography.Paragraph>
        {final.teamSubmission ? <Alert type="success" message={`Submitted · Rank ${final.teamSubmission.winnerRank ?? "—"} · ${final.teamSubmission.pointsAwarded} pts`} /> :
          <Form onFinish={async ({answer}: {answer: string}) => {
            try { await submitFinalAnswer(answer); await refresh(); message.success("Final answer submitted"); }
            catch (error) { message.error(error instanceof Error ? error.message : "Submit failed"); }
          }}>
            <Form.Item name="answer" rules={[{required: true}]}><Input placeholder="Final answer" /></Form.Item>
            <Button htmlType="submit" type="primary">Submit Final</Button>
          </Form>}
      </>}
  </Card>;
}
