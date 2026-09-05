from passlib.context import CryptContext

# 1. Initialize Passlib context configured with Bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 2. Calculating the Password Hash (used during user creation/registration)
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# 3. Verifying Password (used during Login)
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
