import { User } from "@prisma/client";
//import * as dotenv from "dotenv";
import * as jose from "jose";

//dotenv.config();

/**
 * Creates a token containing the user information for future authorization.
 * @param user User information to create the token
 * @returns the token created
 */
export default async function createUserToken(user: User) {
	if (!process.env.JWT_SECRET) {
		throw new Error("JWT_SECRET missing in environment.");
	}
	const tokenObject = { user: { username: user.username, email: user.email } };
	//const userJSON = JSON.stringify(tokenObject);
	//const token = jwt.sign(userJSON, process.env.JWT_SECRET);
	const secret = new TextEncoder().encode(process.env.JWT_SECRET);
	const token = await new jose.SignJWT(tokenObject)
		.setProtectedHeader({ alg: "HS256" })
		.sign(secret);
	return token;
}
