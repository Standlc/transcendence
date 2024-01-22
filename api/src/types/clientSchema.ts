import { User } from "./schema";
import {Selectable} from "kysely"

export type AppUser = Omit<Selectable<User>, 'password'>;
