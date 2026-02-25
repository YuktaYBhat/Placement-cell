import "dotenv/config"
import { prisma } from "../lib/prisma"

async function main() {
  console.log("🌱 Starting seed...")

  // Find or create an admin user to post jobs
  let adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" }
  })

  if (!adminUser) {
    console.log("Creating admin user for job posting...")
    // Create a default admin user if none exists
    // Note: In production, you should create this through proper signup
    adminUser = await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@placement.local",
        role: "ADMIN",
        emailVerified: new Date()
      }
    })
  }

  // Check if jobs already exist
  const existingJobs = await prisma.job.count()
  if (existingJobs > 0) {
    console.log(`✅ ${existingJobs} jobs already exist. Skipping seed.`)
    return
  }

  // Seed 3 sample jobs
  const jobs = [
    {
      title: "Software Development Engineer",
      companyName: "TechCorp Solutions",
      companyLogo: null,
      description: `
        <h3>About the Role</h3>
        <p>We are looking for a talented Software Development Engineer to join our dynamic team. You will be responsible for designing, developing, and maintaining scalable software solutions.</p>
        
        <h3>Responsibilities</h3>
        <ul>
          <li>Design and develop high-quality software applications</li>
          <li>Collaborate with cross-functional teams to define and implement new features</li>
          <li>Write clean, maintainable, and efficient code</li>
          <li>Participate in code reviews and technical discussions</li>
          <li>Debug and resolve technical issues</li>
        </ul>
        
        <h3>Requirements</h3>
        <ul>
          <li>Strong problem-solving skills</li>
          <li>Experience with modern programming languages</li>
          <li>Knowledge of software development best practices</li>
          <li>Excellent communication skills</li>
        </ul>
      `,
      location: "Bangalore, Karnataka",
      category: "FTE" as const,
      tier: "TIER_1" as const,
      isDreamOffer: false,
      jobType: "FULL_TIME" as const,
      workMode: "HYBRID" as const,
      minCGPA: 7.5,
      allowedBranches: ["CSE", "ISE", "ECE"],
      eligibleBatch: "2022 - 2026",
      maxBacklogs: 2,
      salary: "8-12 LPA",
      minSalary: 8.0,
      maxSalary: 12.0,
      requiredSkills: ["Java", "Python", "Data Structures", "Algorithms"],
      preferredSkills: ["React", "Node.js", "AWS", "Docker"],
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      noOfPositions: 5,
      googleFormUrl: "https://forms.gle/techcorp-sde-application",
      status: "ACTIVE" as const,
      isVisible: true,
      postedBy: adminUser.id
    },
    {
      title: "Data Science Intern",
      companyName: "DataAnalytics Inc",
      companyLogo: null,
      description: `
        <h3>About the Internship</h3>
        <p>Join our data science team as an intern and work on real-world machine learning projects. This is a great opportunity to learn from industry experts and contribute to cutting-edge solutions.</p>
        
        <h3>What You'll Do</h3>
        <ul>
          <li>Work on data analysis and machine learning projects</li>
          <li>Assist in building predictive models</li>
          <li>Collaborate with senior data scientists</li>
          <li>Present findings to stakeholders</li>
        </ul>
        
        <h3>What We're Looking For</h3>
        <ul>
          <li>Strong foundation in statistics and mathematics</li>
          <li>Experience with Python and data science libraries</li>
          <li>Curiosity and eagerness to learn</li>
        </ul>
      `,
      location: "Mumbai, Maharashtra",
      category: "INTERNSHIP" as const,
      tier: "TIER_2" as const,
      isDreamOffer: false,
      jobType: "INTERNSHIP" as const,
      workMode: "REMOTE" as const,
      minCGPA: 7.0,
      allowedBranches: ["CSE", "ISE", "DS", "AIML"],
      eligibleBatch: "2022 - 2026",
      maxBacklogs: 3,
      salary: "25,000 - 35,000/month",
      minSalary: 0.3, // 0.3 LPA equivalent
      maxSalary: 0.42, // 0.42 LPA equivalent
      requiredSkills: ["Python", "Machine Learning", "Data Analysis"],
      preferredSkills: ["TensorFlow", "Pandas", "SQL", "Statistics"],
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      noOfPositions: 3,
      googleFormUrl: "https://forms.gle/dataanalytics-intern-application",
      status: "ACTIVE" as const,
      isVisible: true,
      postedBy: adminUser.id
    },
    {
      title: "Full Stack Developer",
      companyName: "StartupHub Technologies",
      companyLogo: null,
      description: `
        <h3>About Us</h3>
        <p>We are a fast-growing startup looking for a Full Stack Developer to help build our next-generation platform. You'll work on both frontend and backend, making a real impact on our product.</p>
        
        <h3>Key Responsibilities</h3>
        <ul>
          <li>Develop and maintain web applications</li>
          <li>Build responsive user interfaces</li>
          <li>Design and implement RESTful APIs</li>
          <li>Work with databases and cloud services</li>
          <li>Participate in agile development process</li>
        </ul>
        
        <h3>Skills Required</h3>
        <ul>
          <li>Proficiency in JavaScript/TypeScript</li>
          <li>Experience with React or similar frameworks</li>
          <li>Backend development experience</li>
          <li>Database design and optimization</li>
        </ul>
      `,
      location: "Pune, Maharashtra",
      category: "FTE" as const,
      tier: "TIER_2" as const,
      isDreamOffer: false,
      jobType: "FULL_TIME" as const,
      workMode: "OFFICE" as const,
      minCGPA: 7.0,
      allowedBranches: [], // All branches allowed
      eligibleBatch: "2022 - 2026",
      maxBacklogs: 4,
      salary: "6-9 LPA",
      minSalary: 6.0,
      maxSalary: 9.0,
      requiredSkills: ["JavaScript", "React", "Node.js", "MongoDB"],
      preferredSkills: ["TypeScript", "Next.js", "PostgreSQL", "AWS"],
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
      startDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000), // 50 days from now
      noOfPositions: 4,
      googleFormUrl: "https://forms.gle/startuphub-fullstack-application",
      status: "ACTIVE" as const,
      isVisible: true,
      postedBy: adminUser.id
    }
  ]

  console.log("Creating sample jobs...")
  for (const jobData of jobs) {
    const job = await prisma.job.create({
      data: jobData
    })
    console.log(`✅ Created job: ${job.title} at ${job.companyName}`)
  }

  console.log("🎉 Seed completed successfully!")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })





