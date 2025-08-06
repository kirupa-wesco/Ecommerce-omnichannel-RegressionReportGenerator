package com.ecommerce.regression;

import com.ecommerce.regression.utils.JsonReader;
import com.ecommerce.regression.model.TestResults;
import com.ecommerce.regression.report.ReportGenerator;

public class Main {
    public static void main(String[] args) {
        // Example usage
        String artifactsDir = "Artifacts";
        List<com.ecommerce.regression.model.TestCase> allSuccess = new java.util.ArrayList<>();
        List<com.ecommerce.regression.model.TestCase> allFailure = new java.util.ArrayList<>();
        List<com.ecommerce.regression.model.TestCase> allOthers = new java.util.ArrayList<>();
        try {
            java.nio.file.Path artifactsPath = java.nio.file.Paths.get(artifactsDir);
            java.io.File artifactsFolder = artifactsPath.toFile();
            java.io.File[] subfolders = artifactsFolder.listFiles(java.io.File::isDirectory);
            if (subfolders != null) {
                for (java.io.File subfolder : subfolders) {
                    TestResults results = JsonReader.readTestResultsFromFolder(subfolder.getAbsolutePath());
                    allSuccess.addAll(results.getSuccessData());
                    allFailure.addAll(results.getFailureData());
                    allOthers.addAll(results.getOthersData());
                }
            }
            // Use Paths.get for cross-platform output paths
            String successReportPath = java.nio.file.Paths.get("Reports", "Success", "SuccessReport.xlsx").toString();
            String failureReportPath = java.nio.file.Paths.get("Reports", "Failures", "FailureReport.xlsx").toString();
            ReportGenerator.generateSuccessReport(allSuccess, successReportPath);
            ReportGenerator.generateFailureReport(allFailure, failureReportPath);
            // ...other report generations
            System.out.println("Reports generated successfully!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
