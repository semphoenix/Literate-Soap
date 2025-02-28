const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../../config/config");
const { BadRequestError, UnauthorizedError } = require("../../utils/errors");
const { createUserToken } = require("../../utils/tokens");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createPublicUser = ({
  id,
  firstName,
  lastName,
  username,
  email,
  imageUrl,
}) => {
  return {
    id: id,
    firstName: firstName,
    lastName: lastName,
    username: username,
    email: email,
    imageUrl: imageUrl,
  };
};

const loginUser = async (creds) => {
  const { email, password } = creds;

  const normalizedEmail = email.toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail },
  });

  if (user) {
    const isValid = await bcrypt.compare(password, user.password);
    if (isValid === true) {
      const publicUser = createPublicUser(user);
      const userToken = await createUserToken(publicUser);
      return { publicUser, userToken };
    }
    console.log("Wrong password!");
  }
  throw new UnauthorizedError("Invalid Password/Email combination");
};

const registerUser = async (creds) => {
  const { username, password, firstName, lastName, email } = creds;
  const normalizedEmail = email.toLowerCase();
  const existingUserWithEmail = await prisma.user.findFirst({
    where: { email: normalizedEmail },
  });
  if (existingUserWithEmail)
    throw new BadRequestError(
      `User with Email ${normalizedEmail} already exists`
    );

  const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
  const user = await prisma.user.create({
    data: {
      firstName: firstName,
      lastName: lastName,
      username: username,
      email: normalizedEmail,
      password: hashedPassword,
      imageUrl: "sample.png", // Change to user input image later
    },
  });

  const publicUser = createPublicUser(user);
  const userToken = await createUserToken(publicUser);
  return { publicUser, userToken };
};

module.exports = { loginUser, registerUser };
