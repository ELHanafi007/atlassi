import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Phone, MessageCircle, Menu, ChevronRight } from 'lucide-react';
import './App.css';

const listings = [
  {
    id: 1,
    title: 'فيلا مراكش (الأصالة و الحداثة)',
    description: 'فيلا معمارية فريدة تجمع بين أصالة المغرب و حداثة العصر. 1500 متر مربع من الفخامة الخالصة، مسبح مدفأ، جردة أندلسية و إطلالة خلابة على جبال الأطلس.',
    price: '18,500,000 درهم',
    type: 'للبيع',
    category: 'فيلا فاخرة',
    location: 'كليز، مراكش',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=100&w=1600'
  },
  {
    id: 2,
    title: 'بينتهاوس أنفا سكاي (الدار البيضاء)',
    description: 'برطمة في أعلى طابق بأرقى حي في كازا. إطلالة 360 درجة على البحر و المدينة. تصميم داخلي من توقيع أشهر المهندسين، زجاج كامل و مصعد خاص.',
    price: '45,000 درهم / شهر',
    type: 'للكراء',
    category: 'بينتهاوس',
    location: 'أنفا، الدار البيضاء',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=100&w=1600'
  },
  {
    id: 3,
    title: 'رياض الملوك (فاس القديمة)',
    description: 'تحفة تاريخية تم ترميمها بعناية فائقة. 12 غرفة، صحن واسع، نافورة رخامية و سقف من خشب الأرز المنقوش. تجربة العيش في قصر حقيقي.',
    price: '9,200,000 درهم',
    type: 'للبيع',
    category: 'رياض ملكي',
    location: 'المدينة القديمة، فاس',
    image: 'https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=100&w=1600'
  }
];

function App() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#050505] font-sans selection:bg-[#c5a059] selection:text-white overflow-x-hidden" dir="rtl">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ${isScrolled ? 'glass py-4 shadow-sm' : 'bg-transparent py-10'}`}>
        <div className="max-w-[1400px] mx-auto px-8 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <span className="text-3xl font-black tracking-tighter uppercase">أطلسي</span>
            <div className="w-1.5 h-1.5 bg-[#c5a059] rounded-full mt-1.5 group-hover:scale-[3] transition-transform duration-700"></div>
          </motion.div>
          
          <div className="hidden md:flex items-center gap-14 text-[11px] font-black tracking-[0.3em] uppercase opacity-70">
            <a href="#" className="hover:opacity-100 hover:text-[#c5a059] transition-all">البيع</a>
            <a href="#" className="hover:opacity-100 hover:text-[#c5a059] transition-all">الكراء</a>
            <a href="#" className="hover:opacity-100 hover:text-[#c5a059] transition-all">الوجهات</a>
            <button className="bg-black text-white px-10 py-4 rounded-full text-[10px] hover:bg-[#c5a059] transition-all duration-700 shadow-2xl">
              إعلان خاص
            </button>
          </div>

          <div className="md:hidden">
            <Menu size={24} />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-[110vh] w-full flex items-center justify-center overflow-hidden">
        <motion.div 
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=100&w=2400" 
            className="w-full h-full object-cover brightness-[0.7]"
            alt="Luxury"
          />
        </motion.div>
        
        <div className="relative z-10 text-center px-4 max-w-7xl">
          <motion.h1 
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-[70px] md:text-[140px] leading-[0.85] font-black text-white mb-10 tracking-tighter"
          >
            عش <span className="text-[#c5a059]">الاستثناء</span> <br /> في قلب المغرب
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ duration: 1.5, delay: 1.2 }}
            className="text-white text-xl md:text-3xl font-light mb-16 max-w-3xl mx-auto leading-relaxed"
          >
            نخبة العقارات لأرقى الشخصيات. فن العيش المغربي بمعايير عالمية.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.8 }}
            className="flex flex-col md:flex-row gap-6 justify-center items-center"
          >
            <div className="bg-white/10 backdrop-blur-3xl border border-white/20 p-2 rounded-full flex items-center gap-6 px-10 w-full md:w-auto shadow-2xl">
              <Search className="text-white/50" size={24} />
              <input 
                type="text" 
                placeholder="فين كتقلب على دار أحلامك؟" 
                className="bg-transparent text-white outline-none w-72 py-4 text-lg placeholder:text-white/30 font-light"
              />
            </div>
            <button className="bg-[#c5a059] text-white px-16 py-6 rounded-full font-black hover:bg-white hover:text-black transition-all duration-700 text-xs uppercase tracking-[0.4em] shadow-2xl">
              اكتشف الآن
            </button>
          </motion.div>
        </div>

        <motion.div 
          animate={{ y: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/30"
        >
          <div className="w-[1px] h-20 bg-gradient-to-b from-white to-transparent mx-auto"></div>
          <span className="text-[10px] uppercase tracking-[0.5em] mt-4 block">انزل للأسفل</span>
        </motion.div>
      </section>

      {/* Listings */}
      <main className="max-w-[1500px] mx-auto px-10 py-48">
        <div className="flex flex-col md:flex-row justify-between items-end mb-32 gap-10">
          <div className="max-w-2xl text-right">
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              className="flex items-center gap-6 mb-8"
            >
              <div className="w-20 h-[2px] bg-[#c5a059]"></div>
              <span className="text-[#c5a059] text-xs font-black tracking-[0.5em] uppercase">مجموعة 2026</span>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-[50px] md:text-[90px] font-black tracking-tighter leading-none"
            >
              عقارات <span className="opacity-20 text-outline">خالدة.</span>
            </motion.h2>
          </div>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.4 }}
            className="text-lg font-light max-w-sm mb-4 leading-loose"
          >
            نحن لا نعرض العقارات فقط، نحن نصمم أسلوب حياة يليق بتطلعاتكم الكبرى.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24">
          {listings.map((item, idx) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: idx * 0.2 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-[40px] bg-[#f5f5f7] mb-12 shadow-sm group-hover:shadow-2xl transition-all duration-1000">
                <img 
                  src={item.image} 
                  className="w-full h-full object-cover transition-transform duration-[2s] cubic-bezier(0.16, 1, 0.3, 1) group-hover:scale-110"
                  alt={item.title}
                />
                <div className="absolute top-10 left-10">
                  <span className="bg-white/80 backdrop-blur-2xl px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">
                    {item.type}
                  </span>
                </div>
              </div>
              
              <div className="space-y-6 px-4">
                <div className="flex items-center gap-4 text-[11px] font-black text-[#c5a059] uppercase tracking-[0.4em]">
                  <MapPin size={12} />
                  <span>{item.location}</span>
                </div>
                <h3 className="text-3xl font-black group-hover:text-[#c5a059] transition-colors duration-700">
                  {item.title}
                </h3>
                <p className="text-lg text-black/40 font-light leading-relaxed">
                  {item.description}
                </p>
                <div className="flex items-center justify-between pt-8 border-t border-[#f5f5f7]">
                  <span className="text-2xl font-black tracking-tighter">{item.price}</span>
                  <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0">
                    <button className="p-5 bg-black text-white rounded-full hover:bg-[#c5a059] transition-all shadow-xl">
                      <MessageCircle size={24} />
                    </button>
                    <button className="p-5 bg-[#f5f5f7] rounded-full hover:bg-black hover:text-white transition-all shadow-xl">
                      <Phone size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Philosophy */}
      <section className="bg-[#050505] text-white py-60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#c5a059]/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="max-w-[1500px] mx-auto px-10 grid grid-cols-1 lg:grid-cols-2 gap-48 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5 }}
            className="relative rounded-[60px] overflow-hidden"
          >
            <img 
              src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1200" 
              className="w-full aspect-[4/5] object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-1000"
              alt="Luxury"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent"></div>
          </motion.div>
          
          <div className="space-y-16 relative z-10">
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <span className="text-[#c5a059] text-xs font-black tracking-[0.6em] uppercase underline underline-offset-[20px] decoration-[#c5a059]/30">مهمتنا</span>
              <h2 className="text-[60px] md:text-[110px] font-black leading-[0.8] tracking-tighter">
                الفخامة <br /> كعقيدة.
              </h2>
            </motion.div>
            <p className="text-xl md:text-2xl font-light text-white/40 leading-relaxed max-w-xl italic">
              "في أطلسي، لا نبحث عن المشترين، بل نبحث عن الأمناء على هذه التحف المعمارية التي نقدمها."
            </p>
            <button className="group flex items-center gap-10 text-[10px] font-black tracking-[0.5em] uppercase py-6 px-10 border border-white/10 rounded-full hover:bg-white hover:text-black transition-all duration-700">
              انضم إلى عالمنا
              <ChevronRight className="group-hover:translate-x-3 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-40 border-t border-[#f5f5f7]">
        <div className="max-w-[1500px] mx-auto px-10 flex flex-col lg:flex-row justify-between items-start gap-32">
          <div className="space-y-12">
            <div className="flex items-center gap-4">
              <span className="text-5xl font-black tracking-tighter uppercase">أطلسي</span>
              <div className="w-2.5 h-2.5 bg-[#c5a059] rounded-full"></div>
            </div>
            <p className="text-black/30 text-lg max-w-md font-light leading-relaxed">
              الوجهة الحصرية لأرقى العقارات في المملكة المغربية. نحن نعيد تعريف مفهوم الرفاهية للأجيال القادمة.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-32">
            <div className="space-y-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">الشركة</h4>
              <ul className="space-y-6 text-sm font-black uppercase tracking-widest">
                <li><a href="#" className="hover:text-[#c5a059] transition-colors">الفلسفة</a></li>
                <li><a href="#" className="hover:text-[#c5a059] transition-colors">الخدمات الحصرية</a></li>
                <li><a href="#" className="hover:text-[#c5a059] transition-colors">اتصل بنا</a></li>
              </ul>
            </div>
            <div className="space-y-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">العقارات</h4>
              <ul className="space-y-6 text-sm font-black uppercase tracking-widest">
                <li><a href="#" className="hover:text-[#c5a059] transition-colors">مجموعة الفيلات</a></li>
                <li><a href="#" className="hover:text-[#c5a059] transition-colors">البينتهاوس</a></li>
                <li><a href="#" className="hover:text-[#c5a059] transition-colors">القصور الملكية</a></li>
              </ul>
            </div>
            <div className="space-y-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">تواصل</h4>
              <ul className="space-y-6 text-sm font-black uppercase tracking-widest">
                <li><a href="#" className="hover:text-[#c5a059] transition-colors">إنستغرام</a></li>
                <li><a href="#" className="hover:text-[#c5a059] transition-colors">لينكد إن</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-[1500px] mx-auto px-10 mt-40 pt-16 border-t border-[#f5f5f7] flex flex-col md:flex-row justify-between items-center gap-10 text-[10px] font-black text-black/20 uppercase tracking-[0.6em]">
          <span>© 2026 أطلسي - قمة الرفاهية المغربية</span>
          <span>صُنع بفخر في المملكة المغربية</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
