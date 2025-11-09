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
          color: "bg-orange-500",
        },
        {
          id: "messageRecruiter",
          title: "Message to Recruiter",
          color: "bg-yellow-500",
        },
        {
          id: "messageHiringManager",
          title: "Message to Hiring Manager",
          color: "bg-green-500",
        },
        {
          id: "interview",
          title: "Interview",
          color: "bg-blue-500",
        },
        {
          id: "offer",
          title: "Offer",
          color: "bg-violet-500",
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
        {
          id: "followUp",
          title: "Follow Up",
          color: "bg-yellow-500",
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
          id: "attended",
          title: "Attended",
          color: "bg-green-500",
        },
        {
          id: "connectedOnline",
          title: "Connected Online",
          color: "bg-purple-500",
        },
        {
          id: "followUp",
          title: "Follow Up",
          color: "bg-yellow-500",
        },
      ];
    case "linkedinOutreach":
      return [
        {
          id: "outreachRequestSent",
          title: "LinkedIn Request Sent",
          color: "bg-yellow-500",
        },
        {
          id: "accepted",
          title: "Request Accepted",
          color: "bg-green-500",
        },
        {
          id: "followedUp",
          title: "Follow Up Message",
          color: "bg-purple-500",
        },
        {
          id: "linkedinOutreach",
          title: "Informational Interview",
          color: "bg-blue-500",
        },
      ];
    default:
      return [];
  }
};
