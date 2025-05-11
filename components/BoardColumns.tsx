import { ColumnConfig } from "./DragAndDrop";

export type BoardType =
  | "applications"
  | "careerFairs"
  | "inPersonEvents"
  | "linkedinOutreach";

/**
 * Component that returns column configurations for different board types
 */
export const getBoardColumns = (boardType: BoardType): ColumnConfig[] => {
  switch (boardType) {
    case "applications":
      return [
        {
          id: "applied",
          title: "Applied",
          color: "bg-blue-500",
        },
        {
          id: "msgToRecruiter",
          title: "Messaged Recruiter",
          color: "bg-purple-500",
        },
        {
          id: "msgToManager",
          title: "Messaged Manager",
          color: "bg-indigo-500",
        },
        {
          id: "interview",
          title: "Interview",
          color: "bg-yellow-500",
        },
        {
          id: "offer",
          title: "Offer",
          color: "bg-green-500",
        },
      ];
    case "careerFairs":
      return [
        {
          id: "scheduled",
          title: "Scheduled",
          color: "bg-blue-500",
        },
        {
          id: "attended",
          title: "Attended",
          color: "bg-green-500",
        },
      ];
    case "inPersonEvents":
      return [
        {
          id: "scheduled",
          title: "Scheduled",
          color: "bg-blue-500",
        },
        {
          id: "registered",
          title: "Registered",
          color: "bg-purple-500",
        },
        {
          id: "attended",
          title: "Attended",
          color: "bg-green-500",
        },
      ];
    case "linkedinOutreach":
      return [
        {
          id: "toContact",
          title: "To Contact",
          color: "bg-blue-500",
        },
        {
          id: "contacted",
          title: "Contacted",
          color: "bg-yellow-500",
        },
        {
          id: "responded",
          title: "Responded",
          color: "bg-green-500",
        },
        {
          id: "meeting",
          title: "Meeting Scheduled",
          color: "bg-purple-500",
        },
      ];
    default:
      return [];
  }
};
