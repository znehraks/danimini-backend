import { RowDataPacket } from "mysql2";

interface IEntireUser {
  user_id: string;
  user_email: string;
  user_password: string;
  created_at: string;
  updated_at: string;
}

export type TPartialUserRows = Partial<IEntireUser> & RowDataPacket;
export type TEntierUserRows = IEntireUser & RowDataPacket;
