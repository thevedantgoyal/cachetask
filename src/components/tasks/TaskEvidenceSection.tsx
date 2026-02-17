import { useState, useRef } from "react";
import { Upload, FileText, Image, Link, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTaskEvidence, useUploadEvidence } from "@/hooks/useTaskEvidence";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface TaskEvidenceSectionProps {
  taskId: string | null;
  canUpload?: boolean;
}

const evidenceIcons: Record<string, React.ElementType> = {
  screenshot: Image,
  document: FileText,
  pr_link: Link,
  other: File,
};

export const TaskEvidenceSection = ({ taskId, canUpload = false }: TaskEvidenceSectionProps) => {
  const { data: evidence, isLoading } = useTaskEvidence(taskId);
  const uploadEvidence = useUploadEvidence();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [evidenceType, setEvidenceType] = useState("screenshot");
  const [comment, setComment] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !taskId) return;

    try {
      await uploadEvidence.mutateAsync({
        taskId,
        file,
        evidenceType,
        comment: comment.trim() || undefined,
      });
      toast.success("Evidence uploaded");
      setComment("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Failed to upload evidence");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      {canUpload && (
        <div className="space-y-3 p-3 bg-muted/30 rounded-xl border border-border/50">
          <div className="flex gap-2">
            <select
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value)}
              className="text-sm p-2 rounded-lg border border-border bg-background"
            >
              <option value="screenshot">Screenshot</option>
              <option value="document">Document</option>
              <option value="pr_link">PR Link</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a note (optional)"
              className="flex-1 text-sm p-2 rounded-lg border border-border bg-background"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadEvidence.isPending}
          >
            {uploadEvidence.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Upload Evidence
          </Button>
        </div>
      )}

      {/* Evidence list */}
      {!evidence || evidence.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No evidence uploaded yet
        </p>
      ) : (
        <div className="space-y-2">
          {evidence.map((item) => {
            const Icon = evidenceIcons[item.evidence_type] || File;
            return (
              <a
                key={item.id}
                href={item.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium capitalize">
                    {item.evidence_type.replace("_", " ")}
                  </p>
                  {item.comment && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {item.comment}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.uploader_name} •{" "}
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};
