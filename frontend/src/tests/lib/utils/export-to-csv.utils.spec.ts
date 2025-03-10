import {
  FileSystemAccessError,
  combineDatasetsToCsv,
  convertToCsv,
  generateCsvFileToSave,
  type CsvHeader,
} from "$lib/utils/export-to-csv.utils";

type TestPersonData = { name: string; age: number };
type TestFormulaData = { formula: string; value: number };

describe("Export to Csv", () => {
  describe("convertToCSV", () => {
    it("should return an empty string when empty headers are provided", () => {
      const data = [];
      const headers = [];
      const expected = "";
      expect(convertToCsv({ data, headers })).toBe(expected);
    });

    it("should return a string with headers and no content when empty data is provided", () => {
      const data = [];
      const headers = [{ id: "name", label: "name" }];
      const expected = "name";
      expect(convertToCsv({ data, headers })).toBe(expected);
    });

    it("should apply order defined by the headers argument", () => {
      const data: TestPersonData[] = [
        { name: "Peter", age: 25 },
        { name: "John", age: 30 },
      ];
      const headers: CsvHeader<TestPersonData>[] = [
        { id: "age", label: "Age" },
        { id: "name", label: "Name" },
      ];
      const expected = "Age,Name\n25,Peter\n30,John";
      expect(convertToCsv({ data, headers })).toBe(expected);
    });

    it("should handle null, undefined and empty strings ", () => {
      const data: TestPersonData[] = [
        { name: "Peter", age: undefined },
        { name: null, age: 25 },
        { name: "", age: 22 },
      ];
      const headers: CsvHeader<TestPersonData>[] = [
        { id: "name", label: "name" },
        { id: "age", label: "age" },
      ];
      const expected = "name,age\nPeter,\n,25\n,22";
      expect(convertToCsv({ data, headers })).toBe(expected);
    });

    it("should handle values containing commas by wrapping them in quotes", () => {
      const data: TestPersonData[] = [
        { name: "John, Jr.", age: 30 },
        { name: "Jane", age: 25 },
      ];
      const headers: CsvHeader<TestPersonData>[] = [
        { id: "name", label: "name" },
        { id: "age", label: "age" },
      ];
      const expected = 'name,age\n"John, Jr.",30\nJane,25';
      expect(convertToCsv({ data, headers })).toBe(expected);
    });

    it("should escape double quotes by doubling them", () => {
      const data: TestPersonData[] = [
        { name: 'John "Johnny" Doe', age: 30 },
        { name: "Jane", age: 25 },
      ];
      const headers: CsvHeader<TestPersonData>[] = [
        { id: "name", label: "name" },
        { id: "age", label: "age" },
      ];
      const expected = 'name,age\n"John ""Johnny"" Doe",30\nJane,25';
      expect(convertToCsv({ data, headers })).toBe(expected);
    });

    it("should prevent formula injection by prefixing with single quote", () => {
      const data: TestFormulaData[] = [
        { formula: "=SUM(A1:A10)", value: 100 },
        { formula: "@SUM(A1)", value: 400 },
        { formula: "|MACRO", value: 500 },
      ];
      const headers: CsvHeader<TestFormulaData>[] = [
        { id: "formula", label: "formula" },
        { id: "value", label: "value" },
      ];
      const expected =
        "formula,value\n'=SUM(A1:A10),100\n'@SUM(A1),400\n'|MACRO,500";
      expect(convertToCsv({ data, headers })).toBe(expected);
    });

    it("should handle formula injection and special characters in values", () => {
      const data: TestFormulaData[] = [
        { formula: "=SUM(A1:A10)", value: 100 },
        { formula: "+1234567,12", value: 200 },
      ];
      const headers: CsvHeader<TestFormulaData>[] = [
        { id: "formula", label: "formula" },
        { id: "value", label: "value" },
      ];
      const expected = 'formula,value\n\'=SUM(A1:A10),100\n"+1234567,12",200';
      expect(convertToCsv({ data, headers })).toBe(expected);
    });

    it("should handle values containing newlines by wrapping them in quotes", () => {
      const data: TestPersonData[] = [
        { name: "Peter\nParker", age: 24 },
        { name: "Jane Doe", age: 25 },
      ];
      ``;
      const headers: CsvHeader<TestPersonData>[] = [
        { id: "name", label: "Full Name" },
        { id: "age", label: "Age" },
      ];
      const expected = 'Full Name,Age\n"Peter\nParker",24\nJane Doe,25';
      expect(convertToCsv({ data, headers })).toBe(expected);
    });

    it("should add metadata to the CSV file", () => {
      const data: TestPersonData[] = [{ name: "John", age: 30 }];
      const headers: CsvHeader<TestPersonData>[] = [
        { id: "name", label: "name" },
        { id: "age", label: "age" },
      ];
      const metadata = [
        {
          label: "Title",
          value: "This is a test file",
        },
        {
          label: "Export Date",
          value: "10/10/2021, 2:00:00 AM",
        },
      ];
      const expected = `Title,This is a test file\nExport Date,"10/10/2021, 2:00:00 AM"\n\n,,name,age\n,,John,30`;

      expect(convertToCsv({ data, headers, metadata })).toBe(expected);
    });
  });

  describe("combineDatasetsToCsv", () => {
    const headers: CsvHeader<TestPersonData>[] = [
      { id: "name", label: "Name" },
      { id: "age", label: "Age" },
    ];

    it("should handle empty datasets by rendering the headers and two empty spaces between them", () => {
      const datasets = [{ data: [] }, { data: [] }];
      const expected = "Name,Age\n\n\nName,Age";

      expect(combineDatasetsToCsv({ datasets, headers })).toBe(expected);
    });

    it("should handle multiple datasets by rendering them and two empty spaces in between", () => {
      const datasets = [
        {
          data: [
            { name: "John", age: 30 },
            { name: "Jane", age: 25 },
          ],
        },
        {
          data: [
            { name: "Peter", age: 24 },
            { name: "Mary", age: 28 },
          ],
        },
      ];
      const expected =
        "Name,Age\nJohn,30\nJane,25\n\n\nName,Age\nPeter,24\nMary,28";

      expect(combineDatasetsToCsv({ datasets, headers })).toBe(expected);
    });

    it("should handle multiple datasets with metadata", () => {
      const datasets = [
        {
          data: [{ name: "John", age: 30 }],
          metadata: [
            { label: "Report Date", value: "2024-01-01" },
            { label: "Department", value: "Sales" },
          ],
        },
        {
          data: [{ name: "Jane", age: 25 }],
          metadata: [
            { label: "Report Date", value: "2024-01-01" },
            { label: "Department", value: "Marketing" },
          ],
        },
      ];

      const expected =
        "Report Date,2024-01-01\nDepartment,Sales\n\n,,Name,Age\n,,John,30\n\n\nReport Date,2024-01-01\nDepartment,Marketing\n\n,,Name,Age\n,,Jane,25";

      expect(combineDatasetsToCsv({ datasets, headers })).toBe(expected);
    });
  });

  describe("downloadCSV", () => {
    beforeEach(() => {
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    describe("Modern Browser (File System Access API)", () => {
      let mockWritable;
      let mockHandle;

      beforeEach(() => {
        mockWritable = {
          write: vi.fn(),
          close: vi.fn(),
        };

        mockHandle = {
          createWritable: vi.fn().mockResolvedValue(mockWritable),
        };

        vi.stubGlobal(
          "showSaveFilePicker",
          vi.fn().mockResolvedValue(mockHandle)
        );
      });

      it("should use File System Access API when available", async () => {
        await generateCsvFileToSave({
          datasets: [],
          headers: [],
          fileName: "test",
        });

        expect(window.showSaveFilePicker).toHaveBeenCalledWith({
          suggestedName: "test.csv",
          types: [
            {
              description: "Csv file",
              accept: { "text/csv": [".csv"] },
            },
          ],
        });
        expect(mockHandle.createWritable).toHaveBeenCalledTimes(1);
        expect(mockWritable.write).toHaveBeenCalledWith(expect.any(Blob));
        expect(mockWritable.write).toHaveBeenCalledTimes(1);
        expect(mockWritable.close).toHaveBeenCalledTimes(1);
      });

      it("should gracefully handle user cancellation of save dialog", async () => {
        const abortError = new Error("User cancelled");
        abortError.name = "AbortError";

        vi.stubGlobal(
          "showSaveFilePicker",
          vi.fn().mockRejectedValue(abortError)
        );

        await expect(
          generateCsvFileToSave({ datasets: [], headers: [] })
        ).resolves.not.toThrow();
      });

      it("should throw FileSystemAccessError when modern API fails", async () => {
        vi.stubGlobal(
          "showSaveFilePicker",
          vi.fn().mockRejectedValue(new Error("API Error"))
        );

        await expect(
          generateCsvFileToSave({ datasets: [], headers: [] })
        ).rejects.toThrow(FileSystemAccessError);
      });
    });

    describe("Legacy Browser (Fallback method)", () => {
      beforeEach(() => {
        URL.createObjectURL = vi.fn();
        URL.revokeObjectURL = vi.fn();
        window.showSaveFilePicker = undefined;
      });

      it("should use fallback method when showSaveFilePicker is not available", async () => {
        const mockLink = document.createElement("a");
        const clickSpy = vi
          .spyOn(mockLink, "click")
          .mockImplementationOnce(() => {});
        vi.spyOn(document, "createElement").mockReturnValue(mockLink);

        await generateCsvFileToSave({
          datasets: [],
          headers: [],
          fileName: "test",
        });

        expect(URL.createObjectURL).toBeCalledTimes(1);
        expect(clickSpy).toHaveBeenCalled();
        expect(URL.revokeObjectURL).toHaveBeenCalled();
      });

      it("should throw FileSystemAccessError on fallback method failure", async () => {
        document.body.appendChild = vi.fn().mockReturnValueOnce(() => {
          throw new Error("DOM Error");
        });

        await expect(
          generateCsvFileToSave({ datasets: [], headers: [] })
        ).rejects.toThrow(FileSystemAccessError);
      });
    });
  });
});
