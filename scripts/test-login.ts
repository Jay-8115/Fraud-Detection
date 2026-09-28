import { loginAction } from "../src/actions/auth";

async function main() {
  const formData = new FormData();
  formData.append("email", "yadavjay081105@gmail.com");
  formData.append("password", "yadav8115");

  const result = await loginAction(formData);
  console.log("Login Action Result:", result);
}
main();
