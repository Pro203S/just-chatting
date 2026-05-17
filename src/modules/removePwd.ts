export default function removePwd(user: User): APIUser {
    return {
        "id": user.id,
        "name": user.name,
        "profile": user.profile,
        "userId": user.userId
    };
}