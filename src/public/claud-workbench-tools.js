/**
 * Claude Anthropic Workbench Tools - JSON Configuration
 * Good Faith Exteriors Window Products Integration
 * Ready for direct import into Claude Workbench
 */

// Tool 1: Window Product Recommendation Engine
const windowProductRecommendationTool = {
    "name": "window_product_recommender",
    "description": "Analyzes customer requirements and recommends the best window products from Good Faith Exteriors catalog",
    "input_schema": {
        "type": "object",
        "properties": {
            "customer_requirements": {
                "type": "object",
                "properties": {
                    "home_style": {
                        "type": "string",
                        "description": "Architectural style of the home (e.g., Victorian, Modern, Colonial, Farmhouse)"
                    },
                    "budget_range": {
                        "type": "string",
                        "enum": ["budget", "mid-range", "premium", "luxury"],
                        "description": "Customer's budget category"
                    },
                    "energy_efficiency_priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high", "maximum"],
                        "description": "Importance of energy efficiency to the customer"
                    },
                    "maintenance_preference": {
                        "type": "string",
                        "enum": ["low-maintenance", "moderate", "high-maintenance-acceptable"],
                        "description": "Customer's maintenance preference"
                    },
                    "climate_zone": {
                        "type": "string",
                        "description": "Geographic climate zone or region"
                    },
                    "window_count": {
                        "type": "integer",
                        "description": "Approximate number of windows to replace"
                    },
                    "special_requirements": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                        "description": "Special requirements like noise reduction, security, historical preservation"
                    }
                },
                "required": ["budget_range", "energy_efficiency_priority"]
            }
        },
        "required": ["customer_requirements"]
    }
};

// Tool 2: Window Material Comparison Analyzer
const windowMaterialComparisonTool = {
    "name": "window_material_analyzer",
    "description": "Provides detailed comparison of window materials (vinyl, wood, fiberglass, aluminum) based on customer priorities",
    "input_schema": {
        "type": "object",
        "properties": {
            "comparison_criteria": {
                "type": "object",
                "properties": {
                    "durability_importance": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 10,
                        "description": "Importance of durability (1-10 scale)"
                    },
                    "aesthetics_importance": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 10,
                        "description": "Importance of appearance (1-10 scale)"
                    },
                    "maintenance_importance": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 10,
                        "description": "Importance of low maintenance (1-10 scale)"
                    },
                    "energy_efficiency_importance": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 10,
                        "description": "Importance of energy efficiency (1-10 scale)"
                    },
                    "cost_importance": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 10,
                        "description": "Importance of initial cost (1-10 scale)"
                    },
                    "climate_considerations": {
                        "type": "string",
                        "description": "Climate factors to consider (humidity, temperature extremes, salt air, etc.)"
                    }
                },
                "required": ["durability_importance", "aesthetics_importance", "maintenance_importance", "energy_efficiency_importance", "cost_importance"]
            }
        },
        "required": ["comparison_criteria"]
    }
};

// Tool 3: Energy Efficiency Calculator and ROI Analyzer
const energyEfficiencyCalculatorTool = {
    "name": "energy_efficiency_calculator",
    "description": "Calculates energy savings, ROI, and environmental impact of window upgrades",
    "input_schema": {
        "type": "object",
        "properties": {
            "current_windows": {
                "type": "object",
                "properties": {
                    "age": {
                        "type": "integer",
                        "description": "Age of current windows in years"
                    },
                    "type": {
                        "type": "string",
                        "description": "Type of current windows (single-pane, double-pane, etc.)"
                    },
                    "condition": {
                        "type": "string",
                        "enum": ["poor", "fair", "good", "excellent"],
                        "description": "Current condition of windows"
                    }
                },
                "required": ["age", "type", "condition"]
            },
            "proposed_windows": {
                "type": "object",
                "properties": {
                    "u_factor": {
                        "type": "number",
                        "description": "U-factor rating of proposed windows"
                    },
                    "shgc": {
                        "type": "number",
                        "description": "Solar Heat Gain Coefficient"
                    },
                    "energy_star_certified": {
                        "type": "boolean",
                        "description": "Whether windows are Energy Star certified"
                    }
                },
                "required": ["u_factor", "shgc"]
            },
            "home_details": {
                "type": "object",
                "properties": {
                    "square_footage": {
                        "type": "integer",
                        "description": "Home square footage"
                    },
                    "heating_system": {
                        "type": "string",
                        "description": "Type of heating system"
                    },
                    "cooling_system": {
                        "type": "string",
                        "description": "Type of cooling system"
                    },
                    "average_monthly_energy_bill": {
                        "type": "number",
                        "description": "Current average monthly energy bill"
                    },
                    "climate_zone": {
                        "type": "string",
                        "description": "Climate zone or region"
                    }
                },
                "required": ["square_footage", "average_monthly_energy_bill", "climate_zone"]
            }
        },
        "required": ["current_windows", "proposed_windows", "home_details"]
    }
};

// Tool 4: Window Installation Planning Assistant
const windowInstallationPlannerTool = {
    "name": "window_installation_planner",
    "description": "Provides installation timeline, preparation requirements, and project planning guidance",
    "input_schema": {
        "type": "object",
        "properties": {
            "project_scope": {
                "type": "object",
                "properties": {
                    "window_count": {
                        "type": "integer",
                        "description": "Total number of windows to install"
                    },
                    "window_types": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                        "description": "Types of windows being installed"
                    },
                    "home_stories": {
                        "type": "integer",
                        "description": "Number of stories in the home"
                    },
                    "structural_modifications_needed": {
                        "type": "boolean",
                        "description": "Whether structural modifications are required"
                    },
                    "historical_home": {
                        "type": "boolean",
                        "description": "Whether the home has historical significance"
                    }
                },
                "required": ["window_count", "window_types", "home_stories"]
            },
            "customer_preferences": {
                "type": "object",
                "properties": {
                    "preferred_timeline": {
                        "type": "string",
                        "description": "Customer's preferred project timeline"
                    },
                    "seasonal_preferences": {
                        "type": "string",
                        "description": "Preferred season for installation"
                    },
                    "disruption_tolerance": {
                        "type": "string",
                        "enum": ["low", "medium", "high"],
                        "description": "Customer's tolerance for disruption during installation"
                    }
                }
            }
        },
        "required": ["project_scope"]
    }
};

// Tool 5: Competitive Analysis and Value Proposition Generator
const competitiveAnalysisTool = {
    "name": "competitive_analysis_generator",
    "description": "Analyzes competitive landscape and generates value propositions for Good Faith Exteriors products",
    "input_schema": {
        "type": "object",
        "properties": {
            "competitor_quotes": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "company_name": {
                            "type": "string",
                            "description": "Name of competing company"
                        },
                        "quoted_price": {
                            "type": "number",
                            "description": "Competitor's quoted price"
                        },
                        "products_offered": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "description": "Products offered by competitor"
                        },
                        "warranty_terms": {
                            "type": "string",
                            "description": "Competitor's warranty terms"
                        },
                        "installation_timeline": {
                            "type": "string",
                            "description": "Competitor's installation timeline"
                        }
                    },
                    "required": ["company_name", "quoted_price"]
                },
                "description": "Array of competitor quotes and offerings"
            },
            "customer_priorities": {
                "type": "object",
                "properties": {
                    "price_sensitivity": {
                        "type": "string",
                        "enum": ["low", "medium", "high"],
                        "description": "Customer's price sensitivity"
                    },
                    "quality_importance": {
                        "type": "string",
                        "enum": ["low", "medium", "high"],
                        "description": "Importance of quality to customer"
                    },
                    "service_importance": {
                        "type": "string",
                        "enum": ["low", "medium", "high"],
                        "description": "Importance of service quality"
                    },
                    "timeline_importance": {
                        "type": "string",
                        "enum": ["low", "medium", "high"],
                        "description": "Importance of quick installation"
                    }
                },
                "required": ["price_sensitivity", "quality_importance", "service_importance"]
            }
        },
        "required": ["customer_priorities"]
    }
};

// Tool 6: Customer Communication and Follow-up Generator
const customerCommunicationTool = {
    "name": "customer_communication_generator",
    "description": "Generates personalized customer communications, follow-ups, and educational content",
    "input_schema": {
        "type": "object",
        "properties": {
            "communication_type": {
                "type": "string",
                "enum": ["initial_consultation", "quote_follow_up", "installation_preparation", "post_installation", "maintenance_reminder", "seasonal_check"],
                "description": "Type of communication to generate"
            },
            "customer_profile": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Customer's name"
                    },
                    "communication_preference": {
                        "type": "string",
                        "enum": ["email", "phone", "text", "mail"],
                        "description": "Customer's preferred communication method"
                    },
                    "technical_knowledge_level": {
                        "type": "string",
                        "enum": ["beginner", "intermediate", "advanced"],
                        "description": "Customer's technical knowledge level"
                    },
                    "decision_stage": {
                        "type": "string",
                        "enum": ["research", "comparison", "ready_to_buy", "post_purchase"],
                        "description": "Customer's current decision stage"
                    },
                    "primary_concerns": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                        "description": "Customer's primary concerns or questions"
                    }
                },
                "required": ["name", "communication_preference", "decision_stage"]
            },
            "project_details": {
                "type": "object",
                "properties": {
                    "products_recommended": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                        "description": "Products recommended to customer"
                    },
                    "project_timeline": {
                        "type": "string",
                        "description": "Estimated project timeline"
                    },
                    "total_investment": {
                        "type": "number",
                        "description": "Total project investment"
                    },
                    "special_considerations": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                        "description": "Special considerations for the project"
                    }
                }
            }
        },
        "required": ["communication_type", "customer_profile"]
    }
};

// Export all tools for Claude Workbench import
const claudeWorkbenchTools = {
    "tools": [
        windowProductRecommendationTool,
        windowMaterialComparisonTool,
        energyEfficiencyCalculatorTool,
        windowInstallationPlannerTool,
        competitiveAnalysisTool,
        customerCommunicationTool
    ],
    "metadata": {
        "version": "1.0.0",
        "created_for": "Good Faith Exteriors",
        "description": "Comprehensive window consultation and product recommendation tools for Claude Workbench",
        "last_updated": new Date().toISOString(),
        "total_tools": 6,
        "integration_type": "window_products_browser"
    },
    "usage_instructions": {
        "import_process": [
            "1. Copy each tool JSON configuration",
            "2. Import into Claude Workbench Tools section",
            "3. Configure tool parameters as needed",
            "4. Test tool functionality with sample data",
            "5. Integrate with Good Faith Exteriors workflow"
        ],
        "best_practices": [
            "Use tools in sequence for comprehensive consultation",
            "Combine multiple tools for complex customer scenarios",
            "Validate tool outputs with current product catalog",
            "Customize responses based on customer communication preferences",
            "Track tool usage for continuous improvement"
        ]
    }
};

// Individual tool exports for direct import
module.exports = {
    claudeWorkbenchTools,
    windowProductRecommendationTool,
    windowMaterialComparisonTool,
    energyEfficiencyCalculatorTool,
    windowInstallationPlannerTool,
    competitiveAnalysisTool,
    customerCommunicationTool
};

