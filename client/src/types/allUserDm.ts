export interface AllUserDm {
    id: number;
    createdAt: string;
    user1: {
        userId: number;
        avatarUrl: string;
        username: string;
        rating: number;
        status: number;
    };
    user2: {
        userId: number;
        avatarUrl: string;
        username: string;
        rating: number;
        status: number;
    };
}
