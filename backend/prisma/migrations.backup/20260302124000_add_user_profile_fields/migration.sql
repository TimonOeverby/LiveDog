-- Add back profile-related user fields used by auth/users/avatar features.
ALTER TABLE "User"
ADD COLUMN "username" TEXT,
ADD COLUMN "imageUrl" TEXT;

-- Keep username unique when provided (NULLs allowed).
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
