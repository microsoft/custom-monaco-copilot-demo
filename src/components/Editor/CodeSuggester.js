import * as monaco from 'monaco-editor';
import { generateCodeSuggestion } from '../../api/openai';

class CodeSuggester {
  constructor(editor, apiKey, apiUrl, onSuggestionAccepted) {
    this.editor = editor;
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.onSuggestionAccepted = onSuggestionAccepted;
    this.suggestionDelay = 500; // Consider making this configurable if not already
  }

  async provideCompletionItems(model, position) {
    const textUntilPosition = this.getTextUntilPosition(model, position);

    if (textUntilPosition.length < 3) return { suggestions: [] };

    const suggestion = await this.generateContextAwareCodeSuggestion(
      textUntilPosition, 
      model.getValue(), 
      position
    );

    if (!suggestion) return { suggestions: [] };

    return this.buildCompletionSuggestion(suggestion, position);
  }

  getTextUntilPosition(model, position) {
    return model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });
  }

  buildCompletionSuggestion(suggestion, position) {
    return {
      suggestions: [{
        label: suggestion,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: suggestion,
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
      }],
    };
  }

  async generateContextAwareCodeSuggestion(prompt, context, position) {
    const model = this.editor.getModel();
    if (!model) return null;

    const surroundingCode = this.getSurroundingCode(position);
    const previousLine = model.getLineContent(position.lineNumber - 1);
    const nextLine = model.getLineContent(position.lineNumber + 1);

    const enhancedPrompt = this.formatPrompt(prompt, context, surroundingCode, previousLine, nextLine);

    return generateCodeSuggestion(enhancedPrompt, context, this.apiKey, this.apiUrl);
  }

  formatPrompt(prompt, context, surroundingCode, previousLine, nextLine) {
    return `
      Generate code suggestion for the following prompt in the context of the provided code snippet:

      Language: XML (Azure API Management policy code)

      Prompt: ${prompt}

      Context: ${context}

      Surrounding Code: ${surroundingCode}

      Previous Line: ${previousLine}

      Next Line: ${nextLine}

      Considerations:
      - Only reply with the code snippet, no comments, no explanations.
      - Only generate code that can be inserted as-is at the current position. Don't generate any surrounding code.
      - Ensure the generated code is syntactically correct and fits well within the existing code structure.
      - Use appropriate variable names, function names, and coding conventions based on the surrounding code.
      - Consider the context and purpose of the code snippet to provide meaningful suggestions.
      - If the prompt is ambiguous or lacks sufficient context, provide a best-effort suggestion or indicate that more information is needed.
      
      Additionally to the API Management policy code, there is also the following custom policy available
      <set-insurance-data .../>

      This custom policy has the following attributes available, include them to the code compleation accordingly:
      policyNumber
      policyHolderName
      policyStartDate
      policyEndDate
      premiumAmount
      coverageType
      coverageLimit
      deductibleAmount
      paymentFrequency
      policyStatus
      underwriterName
      riskScore
      claimHistoryCount
      policyRenewalDate
      insuredAssetType
      insuredAssetValue
      beneficiaryName
      beneficiaryRelationship
      agentId
      agentRegion
      commissionRate
      policyIssuanceDate
      lastPremiumPaidDate
      nextPremiumDueDate
      totalPremiumPaid
      totalClaimsMade
      totalClaimsPaid
      coverageStartDate
      coverageEndDate
      additionalRiders
      riderCost
      policyCancellationDate
      cancellationReason
      reinstatementDate
      policyAmendmentDate
      amendmentDetails
      specialConditions
      policyNotes
      customerAddress
      customerEmail
      customerPhoneNumber
      emergencyContactName
      emergencyContactPhone
      policyDocumentUrl
      insuredAssetDescription
      assetCondition
      assetLocation
      claimProcessTime
      claimDenialReason
      premiumPaymentMethod
      policyTransferDate
      transferToPolicyHolderName
      underwritingGuidelinesMet
      riskMitigationMeasures
      policyAuditDate
      auditFindings
      correctiveActionTaken
      policyComplianceStatus
      fraudInvestigationFlag
      investigationOutcome
      claimAdjusterName
      adjusterReport
      claimSettlementDate
      settlementAmount
      disputeResolutionMethod
      resolutionOutcome
      customerSatisfactionRating
      policyUpgradeDate
      upgradedCoverageType
      policyDowngradeDate
      downgradedCoverageType
      referralSource
      referralBonus
      loyaltyDiscount
      multiPolicyDiscount
      earlyPaymentDiscount
      latePaymentFee
      reinstatementFee
      policyReinstatementReason
      coverageExclusions
      excludedRiskFactors
      preExistingConditionFlag
      healthDeclarationFormUrl
      vehicleIdentificationNumber
      propertySurveyReportUrl
      securityMeasures
      environmentalRiskAssessment
      geopoliticalRiskZone
      cyberProtectionMeasures
      dataBreachHistoryCount
      encryptionComplianceStatus
      intellectualPropertyCoverage
      businessInterruptionCoverage
      employeeLiabilityCoverage
      productLiabilityCoverage
      publicLiabilityCoverage
      legalDefenseCostCoverage
      crisisManagementCoverage
      reputationProtectionCoverage
      pandemicCoverageLevel
      complianceAuditTrail
      digitalSecurityRating
      policyVersionControl
      versionEffectiveDate
      underwritingDecisionEngineVersion
      premiumAdjustmentFactor
      claimsAdjustmentFactor
      policyholderPortalAccess
      documentUploadDate
      autoRenewalFlag
      renewalDiscountRate
      cancellationFee
      partialWithdrawalLimit
      fullSurrenderValue
      cashValueAccrualRate
      interestRateGuarantee
      mortalityCharge
      expenseCharge
      fundManagementCharge
      allocationRate
      switchFee
      switchLimit
      freeSwitchAllowance
      investmentFundOptions
      fundPerformanceRating
      personalizedRiskProfile
      assetAllocationStrategy
      policyLoanInterestRate
      loanRepaymentSchedule
      collateralAssignment
      gracePeriodLength
      premiumReminderNotices
      electronicPolicyDeliveryOption
      paperlessCommunicationPreference
      customerFeedbackScore
      serviceInteractionCount
      digitalEngagementLevel
      policyholderRetentionRate
      crossSellOpportunityScore
      upsellOpportunityScore
      lifetimeValueEstimate
      churnRiskScore
      customerAcquisitionChannel
      marketingCampaignResponse
      socialMediaEngagementRate
      netPromoterScore
      claimsSubmissionPortal
      onlineClaimTrackingCapability
      virtualAdjusterOption
      claimSettlementOption
      instantClaimPaymentFeature
      fraudDetectionSystem
      anomalyDetectionAlerts
      customerVerificationMethod
      identityTheftProtectionOption
      dataPrivacyComplianceStatus
      GDPRComplianceStatus
      CCPAComplianceStatus
      regulatoryChangeManagementProcess
      legalDisputeHistory
      arbitrationProcessDetails
      settlementAgreementConfidentiality
      contractualLiabilityCoverage
      directorsAndOfficersCoverage
      employmentPracticesLiabilityCoverage
      fiduciaryLiabilityCoverage
      kidnappingAndRansomCoverage
      politicalRiskCoverage
      tradeCreditRiskCoverage
      supplyChainDisruptionCoverage
      environmentalLiabilityCoverage
      marineCargoCoverage
      aviationLiabilityCoverage
      spaceRiskCoverage
      cyberEventResponseTeam
      ransomwareProtectionCoverage
      blockchainTransactionCoverage
      cryptocurrencyRiskAssessment
      intellectualPropertyRiskScoring
      innovationLabPartnership
      insurtechIntegrationLevel
      AIUnderwritingModelAccuracy
      predictiveAnalyticsUseCases
      telematicsDataIntegration
      IoTDeviceCompatibility
      wearableTechHealthMonitoring
      autonomousVehiclePolicyAdaptation
      droneUsagePolicyCoverage
      gigEconomyWorkerCoverage
      remoteWorkplaceRiskAssessment
      disasterRecoveryPlanStatus
      businessContinuityCoverageLimit
      emergencyResponseTeamContact
      pandemicResponsePlanEffectiveDate
      vaccinationCoverageBenefit
      mentalHealthSupportCoverage
      wellnessProgramParticipationRate
      telemedicineServiceOption
      geneticTestingCoverageOption
      personalizedMedicineCoverage
      climateChangeRiskAssessment
      renewableEnergyEquipmentCoverage
      greenBuildingComplianceStatus
      carbonOffsetContributionRate
      biodiversityImpactRating
      sustainableInvestmentCriteria
      ecoFriendlyDiscounts
      plasticReductionInitiativesCoverage
      cleanWaterAccessCoverage
      airQualityImprovementEfforts
      disasterResilientConstructionDiscount
      urbanHeatIslandEffectMitigation
      wildfireDefenceServices
      floodRiskReductionFeatures
      hurricaneProofingMeasures
      earthquakeRetrofittingDiscounts
      volcanicEruptionCoverage
      landslideStabilizationMeasures
      droughtResponseSolutions
      arcticBlastPreparationPlan
      infectiousDiseaseOutbreakResponse
      vaccineDistributionSupport
      medicalSupplyChainInterruptionCoverage
      healthCrisisManagementTeam
      globalHealthAdvisoryPartnerships
      spaceTravelInsuranceOptions
      lunarColonyLifeSupportSystem
      asteroidMiningClaimProtection
      extraterrestrialHabitatWarranty
      zeroGravityInjuryCoverage
      interstellarMessageTransmissionDelayInsurance
      quantumComputingRiskAssessment
      digitalTwinTechnologyIntegration
      holographicDataStorageBackup
      nanotechnologyMaterialDamage
      artificialIntelligenceEthicsCompliance
      roboticsDamageLiability
      autonomousRobotsMalfunctionCoverage
      geneEditingLegalLiability
      biometricDataBreachResponse
      virtualRealityPropertyRights
      augmentedRealityInjuryPrevention
      eSportAthleteInjuryCoverage
      streamingServiceInterruptionInsurance
      socialMediaReputationRecovery
      deepfakeDetectionServices
      onlineHarassmentLegalAssistance
      digitalNomadResidencyStatusAssistance
      cyberbullyingResponseTeams
      darkWebMonitoringServices
      blockchainAssetRecoveryAssistance
      cryptocurrencyVolatilityShield
      tokenizedAssetInsurance
      NFTAuthenticityVerification
      smartContractFailureCoverage
      DAOOperationalRiskAssessment
      gigEconomyVehicleWearAndTear
      remotePilotLiabilityInsurance
      sharedEconomyAssetDamage
      coLivingSpaceLiabilityCoverage
      crowdFundingProjectFailureInsurance
      personalBrandDamageMitigation
      influencerPartnershipDisruption
      subscriptionModelBusinessInterruption
      circularEconomyWasteManagement
      zeroWastePolicyAdherence
      plantBasedProductLiability
      culturedMeatRegulatoryCompliance
      waterReuseSystemInstallationSupport
      energyStorageSystemFailure
      microgridDisruptionCoverage
      decentralizedInternetAccessInterruption
      communitySupportedAgricultureLoss
      urbanFarmingInfrastructureDamage
      verticalGardenMaintenanceCoverage
      pollinatorPopulationProtection
      wildlifeCorridorDisruptionAssessment
      conservationLandTitleInsurance
      ecoTourismTripCancellation
      sustainableFishingPracticesSupport
      renewableResourceHarvestTiming
      climateRefugeeRelocationAssistance
      heatwaveCoolingCenterSupport
      coldSnapHeatingSolutions
      stormwaterManagementSystems
      erosionControlProjectInsurance
      reforestationProjectProtection
      coralReefRestorationSupport
      endangeredSpeciesHabitatInsurance
      zeroCarbonFootprintInitiative
      plasticNeutralCertificationSupport
      electronicWasteRecyclingPrograms


    `;
  }

  getSurroundingCode(position) {
    const model = this.editor.getModel();
    const startLineNumber = Math.max(1, position.lineNumber - 5);
    const endLineNumber = Math.min(model.getLineCount(), position.lineNumber + 5);

    return model.getValueInRange({
      startLineNumber,
      startColumn: 1,
      endLineNumber,
      endColumn: model.getLineMaxColumn(endLineNumber),
    });
  }

  register() {
    this.completionItemProvider = monaco.languages.registerCompletionItemProvider('xml', {
      provideCompletionItems: (model, position) => this.provideCompletionItems(model, position),
    });

    this.editor.onDidChangeCursorSelection(({ selection }) => {
      const model = this.editor.getModel();
      const position = selection.getPosition();
      const word = model.getWordAtPosition(position);
      if (!word) return;

      const suggestion = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endLineNumber: position.lineNumber,
        endColumn: word.endColumn,
      });

      if (suggestion) this.onSuggestionAccepted(suggestion);
    });
  }

  dispose() {
    if (this.completionItemProvider) this.completionItemProvider.dispose();
  }
}

export default CodeSuggester;