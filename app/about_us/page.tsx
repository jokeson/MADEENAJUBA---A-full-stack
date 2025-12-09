export default function AboutUs() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 py-6 xs:py-8 sm:py-10 md:py-12 lg:py-16">
        <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold text-red-500 mb-8 xs:mb-10 sm:mb-12 break-words text-center mt-10">
          About Madeenajuba
        </h1>
        
        <div className="space-y-10 xs:space-y-12 sm:space-y-14">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold mb-6 xs:mb-8 border-b-2 border-red-500 pb-4 text-white">
              What is Madeenajuba?
            </h2>
            <p className="text-base xs:text-lg sm:text-xl leading-relaxed text-white">
              Madeenajuba is a digital platform that connects people, businesses, and communities in one central place. 
              We provide essential services to help people stay informed, find opportunities, manage their money, and discover 
              what's happening around them. Our website brings together news, events, jobs, businesses, and financial services 
              to make daily life easier and more connected.
            </p>
          </section>

          {/* Services Section */}
          <section>
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold mb-8 xs:mb-10 border-b-2 border-red-500 pb-4 text-white">
              Our Services
            </h2>
            
            <div className="space-y-10 xs:space-y-12">
              {/* News Service */}
              <div>
                <h3 className="text-xl xs:text-2xl sm:text-3xl font-semibold mb-4 xs:mb-5 text-white">
                  News & Information
                </h3>
                <p className="text-base xs:text-lg sm:text-xl leading-relaxed mb-4 text-white">
                  Stay updated with the latest news and stories from our community. We cover:
                </p>
                <ul className="list-disc list-outside space-y-2 text-base xs:text-lg sm:text-xl ml-6 text-white">
                  <li>Politics and government news</li>
                  <li>Sports updates and highlights</li>
                  <li>Business and economy news</li>
                  <li>Technology trends and innovations</li>
                  <li>Entertainment and lifestyle</li>
                  <li>Community and local news</li>
                  <li>Breaking news alerts</li>
                  <li>Opinion articles and interviews</li>
                </ul>
                <p className="text-base xs:text-lg sm:text-xl leading-relaxed mt-6 text-white">
                  Our professional journalists work to bring you accurate, timely, and relevant information that matters to you.
                </p>
              </div>

              {/* Events Service */}
              <div>
                <h3 className="text-xl xs:text-2xl sm:text-3xl font-semibold mb-4 xs:mb-5 text-white">
                  Events & Community
                </h3>
                <p className="text-base xs:text-lg sm:text-xl leading-relaxed text-white">
                  Discover and create events in your community. Whether you're looking for concerts, conferences, fundraisers, 
                  campaigns, or local gatherings, our events platform helps you find what's happening near you. You can create 
                  your own events, buy tickets for paid events, or join free community gatherings. We also show live events 
                  happening right now so you never miss out.
                </p>
              </div>

              {/* Jobs Service */}
              <div>
                <h3 className="text-xl xs:text-2xl sm:text-3xl font-semibold mb-4 xs:mb-5 text-white">
                  Job Opportunities
                </h3>
                <p className="text-base xs:text-lg sm:text-xl leading-relaxed text-white">
                  Find your next career opportunity. Companies and employers post job openings on our platform, making it easy 
                  for job seekers to discover positions that match their skills. You can browse available jobs, read job descriptions, 
                  and apply directly through our website. Create an account to start applying for jobs today.
                </p>
              </div>

              {/* Business Directory */}
              <div>
                <h3 className="text-xl xs:text-2xl sm:text-3xl font-semibold mb-4 xs:mb-5 text-white">
                  Business Directory
                </h3>
                <p className="text-base xs:text-lg sm:text-xl leading-relaxed mb-4 text-white">
                  Find businesses near you with real-time information. Our business directory shows:
                </p>
                <ul className="list-disc list-outside space-y-2 text-base xs:text-lg sm:text-xl ml-6 text-white">
                  <li>Pharmacies - see which ones are open or closed right now</li>
                  <li>Clinics - find healthcare services near you</li>
                  <li>Restaurants - discover places to eat</li>
                  <li>Stores - shop at local businesses</li>
                </ul>
                <p className="text-base xs:text-lg sm:text-xl leading-relaxed mt-6 text-white">
                  Each business listing includes contact information, address, manager details, and most importantly, 
                  whether they are currently open or closed - updated in real-time.
                </p>
              </div>

              {/* Wallet Service */}
              <div>
                <h3 className="text-xl xs:text-2xl sm:text-3xl font-semibold mb-4 xs:mb-5 text-white">
                  Kilimanjaro E-Wallet
                </h3>
                <p className="text-base xs:text-lg sm:text-xl leading-relaxed mb-4 text-white">
                  Our secure digital wallet system makes managing money simple and safe. With Kilimanjaro E-Wallet, you can:
                </p>
                <ul className="list-disc list-outside space-y-3 text-base xs:text-lg sm:text-xl ml-6 text-white">
                  <li><strong className="text-red-500">Send Money:</strong> Transfer money to friends, family, or businesses instantly using their Wallet ID</li>
                  <li><strong className="text-red-500">Receive Money:</strong> Get payments directly into your wallet from anywhere</li>
                  <li><strong className="text-red-500">Deposit Funds:</strong> Add money to your wallet using secure redeem codes</li>
                  <li><strong className="text-red-500">Withdraw Cash:</strong> Request cash withdrawals and collect from authorized locations</li>
                  <li><strong className="text-red-500">Create Invoices:</strong> Send professional invoices to customers and get paid electronically</li>
                  <li><strong className="text-red-500">Pay Invoices:</strong> Receive and pay invoices from businesses and service providers</li>
                  <li><strong className="text-red-500">Transaction History:</strong> View all your money transfers, payments, and receipts in one place</li>
                </ul>
                <p className="text-base xs:text-lg sm:text-xl leading-relaxed mt-6 text-white">
                  To get started, simply apply for a wallet by completing our secure verification process. Once approved, 
                  you'll receive a unique Wallet ID and can start using all our financial services.
                </p>
              </div>

              {/* Advertisements */}
              <div>
                <h3 className="text-xl xs:text-2xl sm:text-3xl font-semibold mb-4 xs:mb-5 text-white">
                  Advertisements
                </h3>
                <p className="text-base xs:text-lg sm:text-xl leading-relaxed text-white">
                  Promote your business, announce community events, or share important information through our advertisement 
                  system. Ads appear in designated banner sections across the website, helping you reach the right audience 
                  at the right time.
                </p>
              </div>
            </div>
          </section>

          {/* Technology Section */}
          <section>
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold mb-6 xs:mb-8 border-b-2 border-red-500 pb-4 text-white">
              Our Technology
            </h2>
            <p className="text-base xs:text-lg sm:text-xl leading-relaxed mb-6 text-white">
              Madeenajuba uses modern technology to provide you with a fast, secure, and reliable experience:
            </p>
            <ul className="list-disc list-outside space-y-3 text-base xs:text-lg sm:text-xl ml-6 text-white">
              <li>Secure payment processing and wallet system</li>
              <li>Real-time updates for news, events, and business status</li>
              <li>Mobile-friendly design that works on phones, tablets, and computers</li>
              <li>Safe and encrypted data storage</li>
              <li>Easy-to-use interface for all users</li>
            </ul>
          </section>

          {/* Mission Section */}
          <section>
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold mb-6 xs:mb-8 border-b-2 border-red-500 pb-4 text-white">
              Our Mission
            </h2>
            <p className="text-base xs:text-lg sm:text-xl leading-relaxed text-white">
              At Madeenajuba, we believe in connecting communities and empowering people through technology. We work to provide 
              services that make daily life easier, keep people informed, create opportunities, and support local businesses. 
              Our goal is to be the central digital hub where people can find everything they need - from news and events to 
              jobs and financial services - all in one convenient place.
            </p>
          </section>

          {/* Contact Section */}
          <section>
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold mb-6 xs:mb-8 border-b-2 border-red-500 pb-4 text-white">
              Get in Touch
            </h2>
            <p className="text-base xs:text-lg sm:text-xl leading-relaxed text-white">
              Have questions or need help? We're here to assist you. Visit our contact page or reach out through our support 
              channels. We're committed to providing excellent service to all our users.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

