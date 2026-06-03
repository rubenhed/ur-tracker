type Snapshot = {
  vacant_rooms: number;
  recorded_at: string;
};
export type Area = {
  id: number;
  name_ja: string;
  snapshots: Snapshot[];
};
export type Prefecture = {
  id: number;
  name_ja: string;
  last_checked_at?: string;
  areas: Area[];
};
export type Region = {
  id: number;
  name_ja: string;
  prefectures: Prefecture[];
};
export type SubscribeResponse = {
  subscribed_areas: string[];
};
