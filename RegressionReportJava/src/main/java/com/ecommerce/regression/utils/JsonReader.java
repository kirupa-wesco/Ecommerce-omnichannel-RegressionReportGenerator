package com.ecommerce.regression.utils;

import com.ecommerce.regression.model.*;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import com.fasterxml.jackson.databind.*;

public class JsonReader {
    public static TestResults readTestResultsFromFolder(String folderPath) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        List<TestCase> successData = new ArrayList<>();
        List<TestCase> failureData = new ArrayList<>();
        List<TestCase> othersData = new ArrayList<>();

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(Paths.get(folderPath), "*.json")) {
            for (Path entry : stream) {
                JsonNode json = mapper.readTree(entry.toFile());
                // JS logic expects a single object per file
                String testCaseName = "N/A";
                if (json.has("tags")) {
                    for (JsonNode tag : json.get("tags")) {
                        if (tag.has("type") && tag.get("type").asText().equalsIgnoreCase("testcasekey")) {
                            testCaseName = tag.has("name") ? tag.get("name").asText() : "N/A";
                            break;
                        }
                    }
                }
                String feature = json.has("name") ? json.get("name").asText() : "N/A";
                String scenario = json.has("id") ? json.get("id").asText() : "N/A";
                String rootResult = json.has("result") ? json.get("result").asText("").toUpperCase() : "";

                if (rootResult.equals("FAILURE")) {
                    List<JsonNode> failedSteps = new ArrayList<>();
                    if (json.has("testSteps")) {
                        for (JsonNode step : json.get("testSteps")) {
                            if (step.has("result") && step.get("result").asText().equalsIgnoreCase("FAILURE")) {
                                failedSteps.add(step);
                            }
                            if (step.has("children")) {
                                for (JsonNode child : step.get("children")) {
                                    if (child.has("result") && child.get("result").asText().equalsIgnoreCase("FAILURE")) {
                                        failedSteps.add(child);
                                    }
                                }
                            }
                        }
                    }
                    if (!failedSteps.isEmpty()) {
                        for (JsonNode failedStep : failedSteps) {
                            String rawFailureMsg = json.has("testFailureMessage") ? json.get("testFailureMessage").asText("") : "";
                            String cleanFailureMsg = rawFailureMsg.split("Build info:")[0].trim();
                            TestCase tc = new TestCase();
                            tc.setName(testCaseName);
                            tc.setFeature(feature);
                            tc.setScenario(scenario);
                            tc.setStep(failedStep.has("description") ? failedStep.get("description").asText() : "N/A");
                            tc.setResult(failedStep.has("result") ? failedStep.get("result").asText() : "FAILURE");
                            tc.setRemarks("");
                            tc.setTestFailureClassname(json.has("testFailureClassname") ? json.get("testFailureClassname").asText("") : "");
                            tc.setTestFailureMessage(cleanFailureMsg);
                            tc.setTestFailureSummary(json.has("testFailureSummary") ? json.get("testFailureSummary").asText("") : "");
                            tc.setScreenshot(failedStep.has("screenshotPath") ? failedStep.get("screenshotPath").asText() : "");
                            failureData.add(tc);
                        }
                    } else {
                        String rawFailureMsg = json.has("testFailureMessage") ? json.get("testFailureMessage").asText("") : "";
                        String cleanFailureMsg = rawFailureMsg.split("Build info:")[0].trim();
                        TestCase tc = new TestCase();
                        tc.setName(testCaseName);
                        tc.setFeature(feature);
                        tc.setScenario(scenario);
                        tc.setStep(json.has("methodName") ? json.get("methodName").asText() : "N/A");
                        tc.setResult(rootResult);
                        tc.setRemarks("");
                        tc.setTestFailureClassname(json.has("testFailureClassname") ? json.get("testFailureClassname").asText("") : "");
                        tc.setTestFailureMessage(cleanFailureMsg);
                        tc.setTestFailureSummary(json.has("testFailureSummary") ? json.get("testFailureSummary").asText("") : "");
                        tc.setScreenshot("");
                        failureData.add(tc);
                    }
                } else if (rootResult.equals("SUCCESS")) {
                    TestCase tc = new TestCase();
                    tc.setName(testCaseName);
                    tc.setFeature(feature);
                    tc.setScenario(scenario);
                    tc.setResult("SUCCESS");
                    tc.setRemarks("All steps passed");
                    successData.add(tc);
                } else {
                    TestCase tc = new TestCase();
                    tc.setName(testCaseName);
                    tc.setFeature(feature);
                    tc.setScenario(scenario);
                    tc.setResult(rootResult);
                    tc.setRemarks("Test case not executed or in other state");
                    othersData.add(tc);
                }
            }
        } catch (Exception e) {
            System.err.println("Error reading test results from folder: " + e.getMessage());
            e.printStackTrace();
        }
        return new TestResults(successData, failureData, othersData);
    }
}
