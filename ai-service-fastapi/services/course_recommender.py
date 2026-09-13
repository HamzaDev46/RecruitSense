import urllib.parse

# Curated catalog of top courses, certifications, and high-impact tutorials
CURATED_COURSES = {
    # Programming Languages
    "python": {
        "title": "Python for Everybody Specialization",
        "platform": "Coursera",
        "url": "https://www.coursera.org/specializations/python"
    },
    "javascript": {
        "title": "JavaScript Algorithms and Data Structures",
        "platform": "freeCodeCamp",
        "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/"
    },
    "typescript": {
        "title": "Understanding TypeScript - 2024 Edition",
        "platform": "freeCodeCamp",
        "url": "https://www.youtube.com/watch?v=BwuLxPH8IDs"
    },
    "java": {
        "title": "Java Programming Masterclass",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/java-introduction"
    },
    "php": {
        "title": "PHP with MySQL 2024: The Complete Guide",
        "platform": "freeCodeCamp",
        "url": "https://www.freecodecamp.org/news/php-full-course/"
    },
    "c++": {
        "title": "C++ Programming: From Beginner to Beyond",
        "platform": "freeCodeCamp",
        "url": "https://www.youtube.com/watch?v=vLnPwxZdW4Y"
    },
    "c#": {
        "title": "Foundational C# with Microsoft",
        "platform": "freeCodeCamp",
        "url": "https://www.freecodecamp.org/learn/foundational-c-sharp-with-microsoft/"
    },
    "go": {
        "title": "Go (Golang) Backend Web Development",
        "platform": "freeCodeCamp",
        "url": "https://www.youtube.com/watch?v=yyUHQIec83I"
    },
    "rust": {
        "title": "The Rust Programming Language - Interactive",
        "platform": "Rust Official Docs",
        "url": "https://doc.rust-lang.org/book/"
    },

    # Frontend Frameworks
    "react": {
        "title": "Meta Front-End Developer: React Specialization",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/react-basics"
    },
    "reactjs": {
        "title": "Meta Front-End Developer: React Specialization",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/react-basics"
    },
    "next.js": {
        "title": "Next.js 14 Full Course: React Framework for the Web",
        "platform": "freeCodeCamp",
        "url": "https://www.youtube.com/watch?v=wm5gMKuwSYk"
    },
    "nextjs": {
        "title": "Next.js 14 Full Course: React Framework for the Web",
        "platform": "freeCodeCamp",
        "url": "https://www.youtube.com/watch?v=wm5gMKuwSYk"
    },
    "vue": {
        "title": "Vue.js 3 Complete Masterclass",
        "platform": "Vue Mastery",
        "url": "https://vuejs.org/tutorial/"
    },
    "angular": {
        "title": "Angular - The Complete Guide",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/single-page-web-apps-with-angularjs"
    },
    "tailwind": {
        "title": "Tailwind CSS Full Course for Beginners",
        "platform": "freeCodeCamp",
        "url": "https://www.youtube.com/watch?v=lCxcTsOHrjo"
    },
    "tailwindcss": {
        "title": "Tailwind CSS Full Course for Beginners",
        "platform": "freeCodeCamp",
        "url": "https://www.youtube.com/watch?v=lCxcTsOHrjo"
    },

    # Backend & Architecture
    "laravel": {
        "title": "Laravel 11 Bootcamp: Build Modern PHP Apps",
        "platform": "Laravel Bootcamp",
        "url": "https://bootcamp.laravel.com/"
    },
    "django": {
        "title": "Django for Everybody Specialization",
        "platform": "Coursera",
        "url": "https://www.coursera.org/specializations/django"
    },
    "flask": {
        "title": "Python Flask Web Development Bootcamp",
        "platform": "freeCodeCamp",
        "url": "https://www.youtube.com/watch?v=Z1RJmh_OqeA"
    },
    "fastapi": {
        "title": "FastAPI Masterclass - Modern High Performance APIs",
        "platform": "freeCodeCamp",
        "url": "https://www.youtube.com/watch?v=0sOvCWFmrtA"
    },
    "nodejs": {
        "title": "Node.js and Express.js Full Course",
        "platform": "freeCodeCamp",
        "url": "https://www.freecodecamp.org/news/free-node-js-course/"
    },
    "node": {
        "title": "Node.js and Express.js Full Course",
        "platform": "freeCodeCamp",
        "url": "https://www.freecodecamp.org/news/free-node-js-course/"
    },
    "spring": {
        "title": "Spring Boot 3 Masterclass",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/spring-framework"
    },
    "spring boot": {
        "title": "Spring Boot 3 Masterclass",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/spring-framework"
    },
    "rest api": {
        "title": "Designing RESTful APIs - Architecture & Best Practices",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/rest-api"
    },
    "restful api": {
        "title": "Designing RESTful APIs - Architecture & Best Practices",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/rest-api"
    },
    "microservices": {
        "title": "Microservices Architecture and Implementation",
        "platform": "freeCodeCamp",
        "url": "https://www.youtube.com/watch?v=1xo-0gCVhTU"
    },
    "services": {
        "title": "Building Scalable Backend Microservices & APIs",
        "platform": "freeCodeCamp",
        "url": "https://www.youtube.com/watch?v=1xo-0gCVhTU"
    },

    # Databases
    "mysql": {
        "title": "Relational Database & MySQL Course",
        "platform": "freeCodeCamp",
        "url": "https://www.freecodecamp.org/learn/relational-database/"
    },
    "postgresql": {
        "title": "PostgreSQL for Everybody Specialization",
        "platform": "Coursera",
        "url": "https://www.coursera.org/specializations/postgresql-for-everybody"
    },
    "postgres": {
        "title": "PostgreSQL for Everybody Specialization",
        "platform": "Coursera",
        "url": "https://www.coursera.org/specializations/postgresql-for-everybody"
    },
    "mongodb": {
        "title": "MongoDB Basics & Aggregation Framework",
        "platform": "MongoDB University",
        "url": "https://learn.mongodb.com/"
    },
    "redis": {
        "title": "Redis for Developers - In-Memory Caching",
        "platform": "Redis University",
        "url": "https://university.redis.com/"
    },

    # Cloud & DevOps
    "docker": {
        "title": "Docker for Beginners - Complete DevOps Course",
        "platform": "freeCodeCamp",
        "url": "https://www.youtube.com/watch?v=fqMOX6JJhGo"
    },
    "kubernetes": {
        "title": "Kubernetes Certification Masterclass (CKA)",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/google-cloud-kubernetes"
    },
    "aws": {
        "title": "AWS Cloud Practitioner Essentials",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/aws-cloud-practitioner-essentials"
    },
    "google cloud": {
        "title": "Google Cloud Platform Fundamentals",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/gcp-fundamentals"
    },
    "gcp": {
        "title": "Google Cloud Platform Fundamentals",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/gcp-fundamentals"
    },
    "azure": {
        "title": "Microsoft Azure Fundamentals (AZ-900)",
        "platform": "Microsoft Learn",
        "url": "https://learn.microsoft.com/en-us/training/paths/az-900-describe-cloud-concepts/"
    },
    "ci/cd": {
        "title": "Continuous Integration and Deployment with GitHub Actions",
        "platform": "freeCodeCamp",
        "url": "https://www.youtube.com/watch?v=R8_veQiYBjI"
    },
    "git": {
        "title": "Git & GitHub Crash Course for Developers",
        "platform": "freeCodeCamp",
        "url": "https://www.youtube.com/watch?v=RGOj5yH7evk"
    },

    # AI / ML / Data Science
    "machine learning": {
        "title": "Machine Learning Specialization by Andrew Ng",
        "platform": "Coursera",
        "url": "https://www.coursera.org/specializations/machine-learning-introduction"
    },
    "deep learning": {
        "title": "Deep Learning Specialization",
        "platform": "Coursera",
        "url": "https://www.coursera.org/specializations/deep-learning"
    },
    "nlp": {
        "title": "Natural Language Processing with Hugging Face & PyTorch",
        "platform": "freeCodeCamp",
        "url": "https://www.youtube.com/watch?v=0hKqV_6n7kQ"
    },
    "data science": {
        "title": "IBM Data Science Professional Certificate",
        "platform": "Coursera",
        "url": "https://www.coursera.org/professional-certificates/ibm-data-science"
    },
    "data analysis": {
        "title": "Google Data Analytics Professional Certificate",
        "platform": "Coursera",
        "url": "https://www.coursera.org/professional-certificates/google-data-analytics"
    },

    # Productivity & Office
    "excel": {
        "title": "Excel Skills for Business: Essentials to Advanced",
        "platform": "Coursera",
        "url": "https://www.coursera.org/specializations/excel"
    },
    "ms excel": {
        "title": "Excel Skills for Business: Essentials to Advanced",
        "platform": "Coursera",
        "url": "https://www.coursera.org/specializations/excel"
    },
    "power bi": {
        "title": "Microsoft Power BI Data Analyst Professional Certificate",
        "platform": "Coursera",
        "url": "https://www.coursera.org/professional-certificates/microsoft-power-bi-data-analyst"
    },

    # Soft Skills
    "communication": {
        "title": "Effective Communication for Tech & Business Leaders",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/effective-communication"
    },
    "leadership": {
        "title": "Strategic Leadership & Management Specialization",
        "platform": "Coursera",
        "url": "https://www.coursera.org/specializations/strategic-leadership"
    },
    "management": {
        "title": "Project Management Principles and Practices",
        "platform": "Coursera",
        "url": "https://www.coursera.org/specializations/project-management"
    },
    "project management": {
        "title": "Google Project Management Professional Certificate",
        "platform": "Coursera",
        "url": "https://www.coursera.org/professional-certificates/google-project-management"
    },
    "teamwork": {
        "title": "Teamwork Skills: Communicating Effectively in Groups",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/teamwork-skills"
    },
    "problem solving": {
        "title": "Creative Problem Solving and Decision Making",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/creative-problem-solving"
    }
}


def get_recommended_course(skill_name: str) -> dict:
    """
    Returns a structured course recommendation for a given missing skill.
    If skill is not in curated catalog, dynamically generates an authentic search learning link.
    """
    cleaned = (skill_name or "").strip().lower()
    
    if cleaned in CURATED_COURSES:
        match = CURATED_COURSES[cleaned]
        return {
            "skill": skill_name.strip(),
            "course_title": match["title"],
            "course_platform": match["platform"],
            "course_url": match["url"]
        }
    
    # Partial matching
    for key, val in CURATED_COURSES.items():
        if key in cleaned or cleaned in key:
            return {
                "skill": skill_name.strip(),
                "course_title": val["title"],
                "course_platform": val["platform"],
                "course_url": val["url"]
            }

    # Dynamic fallback course link
    encoded_skill = urllib.parse.quote_plus(f"{skill_name} course tutorial")
    return {
        "skill": skill_name.strip(),
        "course_title": f"Mastering {skill_name.strip().title()} (Complete Fundamentals & Projects)",
        "course_platform": "Coursera",
        "course_url": f"https://www.coursera.org/search?query={encoded_skill}"
    }
