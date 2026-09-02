import TicketDetailPanel from "./TicketDetailPanel.jsx";
import ActivitySection from "./ActivitySection.jsx";

// The workspace's right panel: ONE scrollable column with ticket details on
// top and activity content (AI Analysis, dev activity, comments) stacked
// below it — not a separate column. Two panels total (list + this), not three.
export default function TicketPanel({ issue, source, aiLoading, aiHtml, aiError, onRunAiAnalysis, comments }) {
  return (
    <div className="flex-1 min-w-0 overflow-y-auto bg-white">
      <div className="max-w-3xl mx-auto px-8 py-6 space-y-6">
        <TicketDetailPanel issue={issue} source={source} />

        <div className="border-t border-slate-200 pt-6">
          <ActivitySection
            issue={issue}
            source={source}
            aiLoading={aiLoading}
            aiHtml={aiHtml}
            aiError={aiError}
            onRunAiAnalysis={onRunAiAnalysis}
            comments={comments}
          />
        </div>
      </div>
    </div>
  );
}
