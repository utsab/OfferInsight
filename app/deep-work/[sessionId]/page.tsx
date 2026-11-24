import DeepWorkRoom from '@/components/deep-work-room';

export default async function DeepWorkSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <DeepWorkRoom sessionId={sessionId} />;
}
