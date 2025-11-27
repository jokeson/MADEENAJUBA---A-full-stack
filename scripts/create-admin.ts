/**
 * Script to create an admin user
 * Run this with: npx tsx scripts/create-admin.ts
 * Or: node --loader ts-node/esm scripts/create-admin.ts
 */

import { signUpWithRole } from "../lib/server-actions/auth";

async function createAdmin() {
  const email = "ayuelmjok@gmail.com";
  const password = "123456pass";
  const role = "admin";

  console.log("Creating admin user...");
  console.log(`Email: ${email}`);
  console.log(`Role: ${role}`);

  try {
    const result = await signUpWithRole(email, password, role);

    if (result.success && result.user) {
      console.log("\n✅ Admin user created successfully!");
      console.log(`User ID: ${result.user.id}`);
      console.log(`Email: ${result.user.email}`);
      console.log(`Role: ${result.user.role}`);
      console.log(`Created at: ${result.user.createdAt}`);
    } else {
      console.error("\n❌ Failed to create admin user:");
      console.error(result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Error creating admin user:");
    console.error(error);
    process.exit(1);
  }
}

// Run the script
createAdmin();

