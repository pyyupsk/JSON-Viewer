interface RawViewProps {
  content: string;
}

export function RawView({ content }: RawViewProps) {
  return <textarea className="raw-area" readOnly value={content} spellCheck={false} />;
}
