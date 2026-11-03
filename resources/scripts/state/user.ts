import { type Action, action, type Thunk, thunk } from 'easy-peasy';

import updateAccountEmail from '@/api/account/updateAccountEmail';
import updateAccountName from '@/api/account/updateAccountName';

export interface UserData {
    uuid: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    language: string;
    rootAdmin: boolean;
    useTotp: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserStore {
    data?: UserData;
    setUserData: Action<UserStore, UserData>;
    updateUserData: Action<UserStore, Partial<UserData>>;
    updateUserEmail: Thunk<UserStore, { email: string; password: string }, unknown, UserStore, Promise<void>>;
    updateUserName: Thunk<UserStore, { firstName: string; lastName: string }, unknown, UserStore, Promise<void>>;
}

const user: UserStore = {
    data: undefined,
    setUserData: action((state, payload) => {
        state.data = payload;
    }),

    updateUserData: action((state, payload) => {
        // @ts-expect-error limitation of Typescript, can't do much about that currently unfortunately.
        state.data = { ...state.data, ...payload };
    }),

    updateUserEmail: thunk(async (actions, payload) => {
        await updateAccountEmail(payload.email, payload.password);

        actions.updateUserData({ email: payload.email });
    }),

    updateUserName: thunk(async (actions, payload) => {
        await updateAccountName(payload.firstName, payload.lastName);

        actions.updateUserData({
            firstName: payload.firstName,
            lastName: payload.lastName,
        });
    }),
};

export default user;
