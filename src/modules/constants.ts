const generateNegativeNum = () => (Math.floor(Math.random() * 1000000) * -1);

export const getDeletedUser = (): APIUser => ({
    "id": `USR-${generateNegativeNum()}`,
    "name": "Deleted User",
    "profile": {
        "type": "asset",
        "url": "/assets/defaultUser.png"
    },
    "userId": "deleted_user"
});

export const getDeletedAttachment = (): APIAttachment => ({
    "id": `ATH-${generateNegativeNum()}`,
    "uploader": getDeletedUser(),
    "size": 18406,
    "url": "/assets/notAvailableContent.ts"
})