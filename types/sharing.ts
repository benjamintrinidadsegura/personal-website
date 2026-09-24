export const shareCardStyles = ["editorial", "socialPost"] as const;
export type ShareCardStyle = (typeof shareCardStyles)[number];
