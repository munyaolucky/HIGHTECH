import UniversalDocumentUploader from './UniversalDocumentUploader';

export default function DocumentUploadPage({
  onUploaded,
  onCancel,
  isStudent = false,
}: {
  onUploaded: (docId: string) => void | Promise<void>;
  onCancel?: () => void;
  isStudent?: boolean;
}) {
  return (
    <UniversalDocumentUploader
      moduleKey="ALL"
      isStudent={isStudent}
      submitNow={true}
      onUploaded={async (res) => {
        await onUploaded(res.document.id);
      }}
      onCancel={onCancel}
    />
  );
}
