import type { Metadata } from "next";
import EditStoryClient from "./EditStoryClient";

export const metadata: Metadata = {
  title: "Edit story",
  description: "Edit your Lekhoni Kahini story.",
  alternates: { canonical: "/stories/edit" },
};

export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="narrow">
      <div className="section">
        <EditStoryClient storyId={id} />
      </div>
    </div>
  );
}
