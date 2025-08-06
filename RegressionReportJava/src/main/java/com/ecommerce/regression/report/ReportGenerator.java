package com.ecommerce.regression.report;


import com.ecommerce.regression.model.TestCase;
import java.util.List;
import java.io.FileOutputStream;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

public class ReportGenerator {
    public static void generateSuccessReport(List<TestCase> data, String outputPath) {
        writeExcelReport(data, outputPath, "Success Report");
    }

    public static void generateFailureReport(List<TestCase> data, String outputPath) {
        writeExcelReport(data, outputPath, "Failure Report");
    }

    private static void writeExcelReport(List<TestCase> data, String outputPath, String sheetName) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet(sheetName);
            int rowNum = 0;
            // Header (match JS columns)
            String[] headers = new String[] {
                "Test Case Name", "GitHub Job ID", "Branch", "Brand", "Team", "Workflow Name", "Environment", "Feature", "Scenario", "Step", "Result", "Remarks", "Failure category", "Failure Message", "Failure Summary", "Screenshot"
            };
            Row headerRow = sheet.createRow(rowNum++);
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }

            // Data rows
            for (TestCase tc : data) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(tc.getName() != null ? tc.getName() : "");
                row.createCell(1).setCellValue(tc.getGithubJobId() != null ? tc.getGithubJobId() : "");
                row.createCell(2).setCellValue(tc.getBranch() != null ? tc.getBranch() : "");
                row.createCell(3).setCellValue(tc.getBrand() != null ? tc.getBrand() : "");
                row.createCell(4).setCellValue(tc.getTeam() != null ? tc.getTeam() : "");
                row.createCell(5).setCellValue(tc.getWorkflowName() != null ? tc.getWorkflowName() : "");
                row.createCell(6).setCellValue(tc.getEnv() != null ? tc.getEnv() : "");
                row.createCell(7).setCellValue(tc.getFeature() != null ? tc.getFeature() : "");
                row.createCell(8).setCellValue(tc.getScenario() != null ? tc.getScenario() : "");
                row.createCell(9).setCellValue(tc.getStep() != null ? tc.getStep() : "");
                row.createCell(10).setCellValue(tc.getResult() != null ? tc.getResult() : "");
                row.createCell(11).setCellValue(tc.getRemarks() != null ? tc.getRemarks() : "");
                row.createCell(12).setCellValue(tc.getTestFailureClassname() != null ? tc.getTestFailureClassname() : "");
                row.createCell(13).setCellValue(tc.getTestFailureMessage() != null ? tc.getTestFailureMessage() : "");
                row.createCell(14).setCellValue(tc.getTestFailureSummary() != null ? tc.getTestFailureSummary() : "");
                row.createCell(15).setCellValue(tc.getScreenshot() != null ? tc.getScreenshot() : "");
            }

            // Autosize columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Ensure parent directories exist (robust, cross-platform)
            java.nio.file.Path outPath = java.nio.file.Paths.get(outputPath).toAbsolutePath();
            java.nio.file.Path parentDir = outPath.getParent();
            if (parentDir != null) {
                java.nio.file.Files.createDirectories(parentDir);
            }

            // Write to file
            try (FileOutputStream fileOut = new FileOutputStream(outPath.toFile())) {
                workbook.write(fileOut);
            }
        } catch (Exception e) {
            System.err.println("Error writing Excel report: " + e.getMessage());
            e.printStackTrace();
        }
    }
    // Add more report methods as needed
}
