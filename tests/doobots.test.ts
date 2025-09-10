import { Request, Response, File } from "../src/doobots";

describe("Doobots core", () => {
  it("should create a Request with data and files", () => {
    const request = new Request(
      { nome: "Matheus" },
      [{ fileName: "a.txt", base64: "SGVsbG8=" }],
    );

    expect(request.get("nome")).toBe("Matheus");
    expect(request.getFiles().length).toBe(1);
    expect(request.getFile("a.txt")?.fileName).toBe("a.txt");

    const parsed = JSON.parse("{\"data\":{\"nome\":\"Matheus\"},\"files\":[{\"fileName\":\"a.txt\",\"base64\":\"SGVsbG8=\"}]}");

    const requestDeserialized = new Request(parsed.data, parsed.files);
    expect(requestDeserialized.get("nome")).toBe("Matheus");
    expect(requestDeserialized.getFiles().length).toBe(1);
    expect(requestDeserialized.getFile("a.txt")?.fileName).toBe("a.txt");
  });

  it("should add values to Response", () => {
    const response = new Response();
    response.put("greeting", "Ola!");
    response.putFile({ fileName: "a.txt", base64: "SGVsbG8=" });

    expect(response.get("greeting")).toBe("Ola!");
    expect(response.getFile("a.txt")?.fileName).toBe("a.txt");

    console.log(JSON.stringify(response));
  });
});
