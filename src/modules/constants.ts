export const getDeletedUser = () => ({
    "id": "USR-" + (Math.floor(Math.random() * 1000000) * -1),
    "name": "Deleted User",
    "profile": "/assets/defaultUser.png",
    "userId": "deleted_user"
} as APIUser);