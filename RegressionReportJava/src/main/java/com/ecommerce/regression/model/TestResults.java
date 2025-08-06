package com.ecommerce.regression.model;

import java.util.List;

public class TestResults {
    private List<TestCase> successData;
    private List<TestCase> failureData;
    private List<TestCase> othersData;

    public TestResults(List<TestCase> successData, List<TestCase> failureData, List<TestCase> othersData) {
        this.successData = successData;
        this.failureData = failureData;
        this.othersData = othersData;
    }

    public List<TestCase> getSuccessData() { return successData; }
    public List<TestCase> getFailureData() { return failureData; }
    public List<TestCase> getOthersData() { return othersData; }
}
