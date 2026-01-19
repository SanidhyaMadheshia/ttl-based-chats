"use client"



import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { HowItWorks } from "@/components/how-it-works"
import { Highlight } from "@/components/highlight"
import { Footer } from "@/components/footer"
import { useEffect } from "react"
import axios from "axios"

export default function Home() {

  useEffect( ()=> {
    async function checkHealth() {
      
      // fetch('http://localhost:8080/health')
      //   .then(res => res.json())
      //   .then(data => console.log('Health Check:', data))
      //   .catch(err => console.error('Health Check Error:', err));

      const res = await axios.get("http://localhost:8080/health")
      console.log(res.data);
      
    }
    checkHealth();
    

  });

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Highlight />
      <Footer />
    </main>
  )
}
