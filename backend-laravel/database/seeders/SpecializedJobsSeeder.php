<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\JobPosting;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SpecializedJobsSeeder extends Seeder
{
    /**
     * Run the database seeds for ACCA, CA, Mobile Apps, Web Apps (MERN & Laravel), and AI Developer jobs across two distinct companies.
     */
    public function run(): void
    {
        $passwordHash = Hash::make('password123');

        // =========================================================================
        // COMPANY 1: Meridian Financial Advisory & Audit LLP (ACCA & CA Specialists)
        // =========================================================================
        $financeUser = User::firstOrCreate(
            ['email' => 'careers@meridian-advisory.com'],
            [
                'name' => 'Meridian Financial Advisory & Audit LLP',
                'password' => $passwordHash,
                'role' => 'company',
                'email_verified_at' => now(),
                'account_status' => 'active',
            ]
        );

        $financeCompany = Company::firstOrCreate(
            ['user_id' => $financeUser->id],
            [
                'name' => 'Meridian Financial Advisory & Audit LLP',
                'industry' => 'Accounting, Audit & Financial Advisory',
                'description' => 'Meridian Financial Advisory & Audit LLP is a prestigious corporate audit, taxation, and financial advisory firm providing end-to-end statutory audit, risk compliance, tax strategy, and transaction services to leading enterprises.',
                'location' => 'Lahore, Pakistan / Hybrid',
                'website' => 'https://meridian-advisory.example.com',
                'company_size' => '51-200',
                'founded_year' => 2012,
                'verification_status' => 'verified',
                'contact_email' => 'careers@meridian-advisory.com',
                'phone' => '+92 42 3578 9900',
                'dark_mode' => false,
                'notify_messages' => true,
                'notify_candidate_activity' => true,
                'notify_quiz_results' => true,
                'notify_post_activity' => true,
            ]
        );

        // Jobs for Company 1 (ACCA & CA)
        $financeJobs = [
            [
                'title' => 'Senior Audit & Assurance Manager (CA Qualified)',
                'description' => "We are looking for a highly accomplished Chartered Accountant (CA) to manage complex statutory audits, regulatory reviews, and assurance engagements for corporate clients.\n\nKey Responsibilities:\n- Lead statutory and internal audit engagements in compliance with International Standards on Auditing (ISA) and IFRS.\n- Supervise audit teams, perform detailed working paper reviews, and present findings to client Audit Committees.\n- Assess internal control environments, risk registers, and operational governance frameworks.\n- Advise corporate leadership on accounting treatments, regulatory disclosures, and financial health metrics.\n\nRequirements:\n- ACA / FCA / CA Qualified (ICAP, ICAEW, or equivalent chartered accounting body).\n- 5+ years of post-qualification audit experience, preferably with Big 4 or top-tier audit firms.\n- Deep mastery of IFRS, local taxation laws, and statutory compliance.",
                'required_skills' => 'CA, Statutory Audit, IFRS, Risk Assessment, Financial Reporting, Internal Controls, Taxation, Team Leadership',
                'job_type' => 'full_time',
                'work_mode' => 'hybrid',
                'experience_level' => 'senior',
                'location' => 'Lahore, Pakistan',
                'salary_min' => 250000,
                'salary_max' => 420000,
                'salary_currency' => 'PKR',
                'application_deadline' => now()->addDays(45)->toDateString(),
                'status' => 'active',
            ],
            [
                'title' => 'Chartered Accountant (CA) - Corporate Tax & Advisory',
                'description' => "Join our tax advisory wing as a Corporate Tax Manager. You will formulate strategic tax plans, manage direct and indirect tax compliance, and defend tax assessments before tax tribunals.\n\nKey Responsibilities:\n- Review and prepare corporate income tax returns, sales tax returns, and advance withholding tax calculations.\n- Formulate transfer pricing documentation and cross-border tax treaty strategies.\n- Handle audits, notices, and appeals before appellate authorities and the Federal Board of Revenue.\n- Guide corporate restructuring, mergers, and tax-efficient capital allocation.\n\nRequirements:\n- CA Qualified or CA Finalist with proven taxation focus.\n- 3-6 years of experience in corporate taxation and tax litigation.\n- Strong analytical problem-solving and executive communication skills.",
                'required_skills' => 'CA, Corporate Tax, Tax Advisory, Income Tax, Sales Tax, Transfer Pricing, Regulatory Compliance, Financial Analysis',
                'job_type' => 'full_time',
                'work_mode' => 'onsite',
                'experience_level' => 'mid',
                'location' => 'Lahore, Pakistan',
                'salary_min' => 190000,
                'salary_max' => 320000,
                'salary_currency' => 'PKR',
                'application_deadline' => now()->addDays(40)->toDateString(),
                'status' => 'active',
            ],
            [
                'title' => 'Senior Financial Analyst (ACCA Qualified)',
                'description' => "We are seeking a proactive Senior Financial Analyst holding an ACCA qualification to drive business valuation, variance analysis, and long-term financial forecasting.\n\nKey Responsibilities:\n- Build robust three-statement financial models, discounted cash flow (DCF) analyses, and sensitivity scenarios.\n- Track key business KPIs, monthly budget vs. actual variances, and gross margin drivers.\n- Partner with department heads to formulate annual operating plans and capital expenditure budgets.\n- Develop interactive dashboards using Power BI and advanced Excel modeling techniques.\n\nRequirements:\n- ACCA Member with 3-5 years of FP&A or financial analysis experience.\n- Expert in financial modeling, forecasting, Power BI, and ERP systems (SAP/Oracle/NetSuite).\n- Clear, concise stakeholder presentation and business storytelling ability.",
                'required_skills' => 'ACCA, Financial Modeling, Budgeting, Forecasting, Variance Analysis, Advanced Excel, Power BI, IFRS',
                'job_type' => 'full_time',
                'work_mode' => 'remote',
                'experience_level' => 'senior',
                'location' => 'Remote / Pakistan',
                'salary_min' => 180000,
                'salary_max' => 290000,
                'salary_currency' => 'PKR',
                'application_deadline' => now()->addDays(50)->toDateString(),
                'status' => 'active',
            ],
            [
                'title' => 'ACCA Trainee / Junior Associate - Audit & Accounts',
                'description' => "An excellent opening for ambitious ACCA students and affiliates to launch their career and complete their Practical Experience Requirement (PER) under approved mentors.\n\nKey Responsibilities:\n- Support senior auditors in voucher verification, bank reconciliations, and physical inventory counts.\n- Assist in drafting financial statements, ledger entries, and audit working papers.\n- Extract and verify trial balance data and execute analytical substantive testing procedures.\n- Research applicable IFRS standards and accounting treatments under senior guidance.\n\nRequirements:\n- ACCA Part-Qualified / Affiliate (Skills Module completed or above).\n- Proficiency with Microsoft Excel and QuickBooks/Xero basics.\n- High attention to detail, numerical aptitude, and a strong work ethic.",
                'required_skills' => 'ACCA, Bookkeeping, Financial Statements, Ledger Reconciliation, MS Excel, QuickBooks, Analytical Skills',
                'job_type' => 'full_time',
                'work_mode' => 'hybrid',
                'experience_level' => 'entry',
                'location' => 'Lahore, Pakistan',
                'salary_min' => 60000,
                'salary_max' => 95000,
                'salary_currency' => 'PKR',
                'application_deadline' => now()->addDays(60)->toDateString(),
                'status' => 'active',
            ],
            [
                'title' => 'Financial Controller & Reporting Lead (ACCA / CA)',
                'description' => "Our client practice requires a seasoned Financial Controller (ACCA or CA qualified) to direct financial reporting, internal controls, and treasury operations.\n\nKey Responsibilities:\n- Oversee full-cycle group accounting, multi-currency consolidations, and month-end closes.\n- Ensure strict adherence to IFRS, statutory standards, and internal corporate governance.\n- Manage banking relationships, working capital facilities, and liquidity forecasts.\n- Lead external audit coordination and mentor finance managers and team accountants.\n\nRequirements:\n- Fully qualified CA or ACCA with 7+ years of progressive financial leadership.\n- Proven track record in corporate financial control, ERP deployment, and team leadership.",
                'required_skills' => 'ACCA, CA, Financial Reporting, Consolidation, Treasury Management, ERP Systems, Audit Supervision, IFRS',
                'job_type' => 'full_time',
                'work_mode' => 'onsite',
                'experience_level' => 'lead',
                'location' => 'Lahore, Pakistan',
                'salary_min' => 320000,
                'salary_max' => 520000,
                'salary_currency' => 'PKR',
                'application_deadline' => now()->addDays(35)->toDateString(),
                'status' => 'active',
            ],
        ];

        foreach ($financeJobs as $jobData) {
            JobPosting::updateOrCreate(
                [
                    'company_id' => $financeCompany->id,
                    'title' => $jobData['title'],
                ],
                $jobData
            );
        }

        // Quiz Questions for Company 1
        QuizQuestion::firstOrCreate(
            [
                'company_id' => $financeCompany->id,
                'question_text' => 'Under IFRS 15, when is revenue from contracts with customers recognized?',
            ],
            [
                'category' => 'Financial Accounting & IFRS',
                'options' => [
                    'When the customer pays the full invoice amount in cash',
                    'When the entity satisfies a performance obligation by transferring promised goods or services',
                    'At the end of the statutory financial year',
                    'Immediately upon signing the written contract',
                ],
                'correct_answer' => 'When the entity satisfies a performance obligation by transferring promised goods or services',
            ]
        );

        QuizQuestion::firstOrCreate(
            [
                'company_id' => $financeCompany->id,
                'question_text' => 'In an external audit, what is the primary purpose of substantive analytical procedures?',
            ],
            [
                'category' => 'Audit & Assurance',
                'options' => [
                    'To evaluate financial information by analyzing plausible relationships among both financial and non-financial data',
                    'To calculate the corporate tax deduction rate',
                    'To replace all tests of details in every audit area',
                    'To evaluate employee attendance records',
                ],
                'correct_answer' => 'To evaluate financial information by analyzing plausible relationships among both financial and non-financial data',
            ]
        );


        // =========================================================================
        // COMPANY 2: Nexora Software & AI Systems (Mobile, Web MERN/Laravel, AI Labs)
        // =========================================================================
        $techUser = User::firstOrCreate(
            ['email' => 'careers@nexora-tech.com'],
            [
                'name' => 'Nexora Software & AI Systems',
                'password' => $passwordHash,
                'role' => 'company',
                'email_verified_at' => now(),
                'account_status' => 'active',
            ]
        );

        $techCompany = Company::firstOrCreate(
            ['user_id' => $techUser->id],
            [
                'name' => 'Nexora Software & AI Systems',
                'industry' => 'Software Development & Artificial Intelligence',
                'description' => 'Nexora Software & AI Systems is an advanced engineering studio building high-impact cross-platform mobile apps, modern MERN & Laravel web platforms, and production-grade Generative AI and Machine Learning solutions.',
                'location' => 'Islamabad, Pakistan / Remote',
                'website' => 'https://nexora-tech.example.com',
                'company_size' => '100-500',
                'founded_year' => 2019,
                'verification_status' => 'verified',
                'contact_email' => 'careers@nexora-tech.com',
                'phone' => '+92 51 2890 1200',
                'dark_mode' => false,
                'notify_messages' => true,
                'notify_candidate_activity' => true,
                'notify_quiz_results' => true,
                'notify_post_activity' => true,
            ]
        );

        // Jobs for Company 2 (Mobile Apps, Web Apps MERN, Web Apps Laravel, AI Developer)
        $techJobs = [
            // --- MOBILE APPS JOBS ---
            [
                'title' => 'Lead Mobile App Developer (Flutter & React Native)',
                'description' => "We are looking for an experienced Lead Mobile App Developer to guide the engineering of our flagship iOS and Android applications using Flutter and React Native.\n\nKey Responsibilities:\n- Lead the architecture, technical roadmap, and release lifecycle of enterprise mobile apps.\n- Implement responsive, intuitive UI/UX with smooth 60fps animations and offline-first persistence (Hive/Isar/SQLite).\n- Integrate secure biometrics, WebSocket feeds, push notifications, and payment gateways.\n- Mentor mobile engineers and ensure rigorous automated testing and CI/CD deployment via fastlane.\n\nRequirements:\n- 5+ years of mobile app development experience with high proficiency in Flutter (Dart) and React Native.\n- Proven store portfolio on Apple App Store and Google Play Store.\n- Deep understanding of clean architecture, Bloc/Provider/Riverpod, and native iOS/Android bridge modules.",
                'required_skills' => 'Flutter, React Native, Dart, iOS, Android, State Management, REST APIs, Firebase, Mobile UI/UX',
                'job_type' => 'full_time',
                'work_mode' => 'remote',
                'experience_level' => 'lead',
                'location' => 'Remote / Islamabad',
                'salary_min' => 300000,
                'salary_max' => 500000,
                'salary_currency' => 'PKR',
                'application_deadline' => now()->addDays(45)->toDateString(),
                'status' => 'active',
            ],
            [
                'title' => 'Mobile Applications Engineer (Android & iOS Native)',
                'description' => "Seeking a skilled Mobile Applications Engineer to build high-performance mobile applications with native platform integrations (Kotlin, Swift, and Flutter).\n\nKey Responsibilities:\n- Develop native and hybrid mobile modules, connecting backend REST/GraphQL APIs.\n- Optimize app memory footprint, battery consumption, and rendering latency.\n- Implement platform-specific capabilities such as background services, Bluetooth, and camera/media processing.\n- Participate in sprint planning, code reviews, and quality assurance.\n\nRequirements:\n- 3+ years building mobile apps with Kotlin, Swift, or Flutter.\n- Experience with Android Jetpack, SwiftUI, or cross-platform state managers.\n- Familiarity with Firebase Analytics, Crashlytics, and Git flow.",
                'required_skills' => 'Kotlin, Swift, Flutter, Android SDK, iOS SDK, Mobile Architecture, Git, CI/CD for Mobile',
                'job_type' => 'full_time',
                'work_mode' => 'hybrid',
                'experience_level' => 'mid',
                'location' => 'Islamabad, Pakistan',
                'salary_min' => 190000,
                'salary_max' => 310000,
                'salary_currency' => 'PKR',
                'application_deadline' => now()->addDays(35)->toDateString(),
                'status' => 'active',
            ],

            // --- WEB APPS - MERN STACK JOBS ---
            [
                'title' => 'Senior Full-Stack MERN Developer (Web Applications)',
                'description' => "We are seeking a Senior MERN Stack Developer to architect and deliver real-time, responsive web applications utilizing MongoDB, Express.js, React, and Node.js.\n\nKey Responsibilities:\n- Design scalable backend microservices and RESTful/GraphQL APIs using Node.js and Express.\n- Architect complex client-side applications in React with TypeScript, Redux Toolkit, and Tailwind CSS.\n- Optimize MongoDB aggregation pipelines, indexing strategies, and database read/write throughput.\n- Implement authentication (JWT/OAuth), role-based access control, and automated unit/integration tests.\n\nRequirements:\n- 4+ years of professional full-stack development experience with the MERN ecosystem.\n- Strong expertise in Node.js, Express, React, TypeScript, and MongoDB.\n- Solid grasp of asynchronous programming, event-driven architectures, and Docker containerization.",
                'required_skills' => 'React, Node.js, Express.js, MongoDB, JavaScript, TypeScript, Redux Toolkit, REST APIs, Tailwind CSS',
                'job_type' => 'full_time',
                'work_mode' => 'remote',
                'experience_level' => 'senior',
                'location' => 'Remote / Islamabad',
                'salary_min' => 240000,
                'salary_max' => 400000,
                'salary_currency' => 'PKR',
                'application_deadline' => now()->addDays(40)->toDateString(),
                'status' => 'active',
            ],
            [
                'title' => 'Junior MERN Stack Web Developer',
                'description' => "Great opportunity for an ambitious junior web developer proficient in the MERN stack to contribute to customer-facing SaaS web applications.\n\nKey Responsibilities:\n- Build dynamic, accessible UI components in React using modern hooks and Tailwind CSS.\n- Implement Express routes, middleware, and controllers connected to MongoDB schemas via Mongoose.\n- Write unit tests, resolve bugs, and collaborate with UI/UX designers and senior engineers.\n- Assist in CI/CD deployments and cloud service configurations.\n\nRequirements:\n- 1-2 years of hands-on experience or substantial personal projects in MongoDB, Express, React, and Node.js.\n- Good understanding of JavaScript (ES6+), HTML5, CSS3, and REST API consumption.\n- Willingness to learn fast and embrace modern engineering standards.",
                'required_skills' => 'MongoDB, Express.js, React, Node.js, JavaScript, HTML5, CSS3, Tailwind CSS, Git',
                'job_type' => 'full_time',
                'work_mode' => 'onsite',
                'experience_level' => 'junior',
                'location' => 'Islamabad, Pakistan',
                'salary_min' => 90000,
                'salary_max' => 150000,
                'salary_currency' => 'PKR',
                'application_deadline' => now()->addDays(50)->toDateString(),
                'status' => 'active',
            ],

            // --- WEB APPS - LARAVEL STACK JOBS ---
            [
                'title' => 'Senior Laravel & PHP Web Developer',
                'description' => "We are looking for a seasoned Senior Laravel Developer to architect backend services, database architectures, and business logic for our web applications.\n\nKey Responsibilities:\n- Architect modular Laravel applications utilizing Eloquent ORM, repositories, and domain events.\n- Build performant RESTful APIs and real-time interactive interfaces with Laravel Livewire and Blade/Vue.\n- Optimize complex MySQL queries, indexes, background job queues, and Redis caching layers.\n- Maintain high test coverage with Pest/PHPUnit and automate staging/production releases.\n\nRequirements:\n- 4+ years of dedicated professional experience with PHP 8+ and Laravel.\n- Mastery of relational database modeling (MySQL/PostgreSQL), caching, and REST API design.\n- Experience with Docker, Redis, and modern frontend integration (Livewire, Alpine, or Vue/React).",
                'required_skills' => 'Laravel, PHP, MySQL, Livewire, Redis, REST APIs, Tailwind CSS, Eloquent ORM, Docker, PHPUnit',
                'job_type' => 'full_time',
                'work_mode' => 'hybrid',
                'experience_level' => 'senior',
                'location' => 'Islamabad, Pakistan',
                'salary_min' => 250000,
                'salary_max' => 420000,
                'salary_currency' => 'PKR',
                'application_deadline' => now()->addDays(40)->toDateString(),
                'status' => 'active',
            ],
            [
                'title' => 'Laravel Full-Stack Engineer (Laravel + React/Inertia)',
                'description' => "Join our web applications division as a Laravel Full-Stack Engineer combining Laravel's backend power with modern React interfaces via Inertia.js.\n\nKey Responsibilities:\n- Develop full-stack features using Laravel for API and backend logic, and React + Inertia for frontend views.\n- Implement secure authentication, granular authorization gates, and multi-tenant architectures.\n- Design automated jobs, asynchronous notifications, and webhook consumers.\n- Optimize asset bundling with Vite and styling with Tailwind CSS.\n\nRequirements:\n- 3+ years of full-stack web engineering experience with PHP/Laravel and React.\n- Hands-on experience with Inertia.js or modern decoupled SPA architectures.\n- Solid understanding of Git workflows, relational schemas, and web security best practices.",
                'required_skills' => 'Laravel, React, Inertia.js, PHP, MySQL, JavaScript, Vite, Tailwind CSS, REST APIs',
                'job_type' => 'full_time',
                'work_mode' => 'remote',
                'experience_level' => 'mid',
                'location' => 'Remote / Pakistan',
                'salary_min' => 180000,
                'salary_max' => 310000,
                'salary_currency' => 'PKR',
                'application_deadline' => now()->addDays(45)->toDateString(),
                'status' => 'active',
            ],

            // --- AI DEVELOPER JOBS ---
            [
                'title' => 'Senior AI & Machine Learning Engineer',
                'description' => "Nexora AI Labs is seeking a passionate Senior AI/ML Engineer to design, train, and deploy predictive and deep learning models into production cloud environments.\n\nKey Responsibilities:\n- Design end-to-end machine learning pipelines from data ingestion and cleaning to feature engineering and inference.\n- Train and fine-tune deep learning models for classification, regression, and ranking using PyTorch/TensorFlow.\n- Containerize models and expose high-throughput, low-latency inference endpoints with FastAPI and Docker.\n- Monitor model drift, latency, and performance metrics in production MLOps pipelines.\n\nRequirements:\n- 4+ years of practical experience in Machine Learning, Deep Learning, and Python.\n- Strong expertise in PyTorch or TensorFlow, Scikit-Learn, Pandas, NumPy, and FastAPI.\n- Solid understanding of linear algebra, calculus, probability, and optimization algorithms.",
                'required_skills' => 'Python, PyTorch, TensorFlow, Machine Learning, Deep Learning, FastAPI, NLP, Scikit-Learn, Docker, MLOps',
                'job_type' => 'full_time',
                'work_mode' => 'remote',
                'experience_level' => 'senior',
                'location' => 'Remote / Islamabad',
                'salary_min' => 280000,
                'salary_max' => 480000,
                'salary_currency' => 'PKR',
                'application_deadline' => now()->addDays(50)->toDateString(),
                'status' => 'active',
            ],
            [
                'title' => 'Generative AI & LLM Solutions Developer',
                'description' => "We are looking for a Generative AI Specialist to develop intelligent conversational agents, document intelligence workflows, and Retrieval-Augmented Generation (RAG) systems.\n\nKey Responsibilities:\n- Architect production RAG systems with vector databases (Chroma, Pinecone, Qdrant) and embedding models.\n- Build agentic AI workflows and tool-calling pipelines using LangChain, LlamaIndex, and open-source LLMs.\n- Fine-tune and evaluate LLMs (Llama 3, Mistral) for domain-specific automation and task execution.\n- Optimize prompt engineering, token consumption, caching, and guardrails for responsible AI.\n\nRequirements:\n- 3+ years of Python engineering experience with at least 1.5 years focused on Generative AI and LLMs.\n- Deep familiarity with LangChain/LlamaIndex, OpenAI/HuggingFace APIs, vector stores, and embeddings.\n- Experience deploying scalable AI backends using FastAPI and asynchronous architectures.",
                'required_skills' => 'Python, Generative AI, Large Language Models (LLMs), LangChain, LlamaIndex, Vector Databases, ChromaDB, FastAPI, Prompt Engineering',
                'job_type' => 'full_time',
                'work_mode' => 'remote',
                'experience_level' => 'senior',
                'location' => 'Remote / Pakistan',
                'salary_min' => 300000,
                'salary_max' => 520000,
                'salary_currency' => 'PKR',
                'application_deadline' => now()->addDays(40)->toDateString(),
                'status' => 'active',
            ],
            [
                'title' => 'Computer Vision & Deep Learning Developer',
                'description' => "Nexora AI Labs is seeking a Computer Vision Developer to build intelligent visual analytics, facial verification, and object detection systems.\n\nKey Responsibilities:\n- Develop and optimize computer vision models using OpenCV, PyTorch, and YOLO architectures.\n- Implement real-time video stream processing, spatial tracking, and visual segmentation algorithms.\n- Deploy and quantize models (ONNX, TensorRT) for fast inference on GPU cloud servers and edge devices.\n- Collaborate with product teams to integrate visual intelligence into mobile and web products.\n\nRequirements:\n- 3+ years in Computer Vision, image processing, and deep neural networks.\n- Expertise in OpenCV, PyTorch, YOLO, CNN architectures, and Python.\n- Experience with inference optimization and REST API streaming endpoints.",
                'required_skills' => 'Python, OpenCV, YOLO, PyTorch, Computer Vision, Convolutional Neural Networks, Deep Learning, FastAPI',
                'job_type' => 'full_time',
                'work_mode' => 'hybrid',
                'experience_level' => 'mid',
                'location' => 'Islamabad, Pakistan',
                'salary_min' => 210000,
                'salary_max' => 360000,
                'salary_currency' => 'PKR',
                'application_deadline' => now()->addDays(45)->toDateString(),
                'status' => 'active',
            ],
        ];

        foreach ($techJobs as $jobData) {
            JobPosting::updateOrCreate(
                [
                    'company_id' => $techCompany->id,
                    'title' => $jobData['title'],
                ],
                $jobData
            );
        }

        // Quiz Questions for Company 2
        QuizQuestion::firstOrCreate(
            [
                'company_id' => $techCompany->id,
                'question_text' => 'In a Retrieval-Augmented Generation (RAG) system, what is the role of the vector database?',
            ],
            [
                'category' => 'Generative AI & LLMs',
                'options' => [
                    'To store dense embedding vectors and perform fast semantic similarity searches to retrieve relevant context',
                    'To execute SQL queries and relational table joins',
                    'To replace Python runtime code in the LLM execution pipeline',
                    'To compile C++ code into machine assembly',
                ],
                'correct_answer' => 'To store dense embedding vectors and perform fast semantic similarity searches to retrieve relevant context',
            ]
        );

        QuizQuestion::firstOrCreate(
            [
                'company_id' => $techCompany->id,
                'question_text' => 'In modern state management (e.g. Flutter Bloc or React Redux), what is the key benefit of unidirectional data flow?',
            ],
            [
                'category' => 'Application Architecture',
                'options' => [
                    'It makes state transitions predictable, easier to debug, and eliminates direct mutation race conditions',
                    'It prevents the application from making any network calls',
                    'It removes the need to write CSS or UI components',
                    'It compiles code twice as fast',
                ],
                'correct_answer' => 'It makes state transitions predictable, easier to debug, and eliminates direct mutation race conditions',
            ]
        );
    }
}
